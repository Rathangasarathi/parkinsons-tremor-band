function files = fetch_sessions(baseUrl)
% Download recordings from the running real-hardware backend and label them locally.
% Does not start the simulator and refuses recordings marked simulated.
if nargin < 1 || isempty(baseUrl), baseUrl = 'http://127.0.0.1:8000'; end
cfg = config();
if ~exist(cfg.rawDir,'dir'), mkdir(cfg.rawDir); end
try
    opts = weboptions('Timeout',20);
    items = webread([char(baseUrl) '/api/recordings'], opts);
catch ME
    error('Could not reach backend at %s. Start it without --simulate. Details: %s', baseUrl, ME.message);
end
if isempty(items), files = strings(0,1); fprintf('No recordings are available on the backend yet.\n'); return; end
files = strings(0,1);
for k = 1:numel(items)
    name = string(items(k).name);
    if endsWith(name, '_sim.jsonl') || contains(name, '_sim.')
        fprintf('Skipping simulated recording: %s\n', name); continue;
    end
    [~, stem] = fileparts(name);
    % Do not download a file already imported under this source name.
    marker = fullfile(cfg.rawDir, ['source_' char(stem) '.txt']);
    if isfile(marker), fprintf('Already imported: %s\n', name); continue; end
    answer = inputdlg({sprintf('Enter the true label for %s (e.g. rest, tremor, voluntary):', name)}, ...
                      'Label real recording', [1 70], {'unlabelled'});
    if isempty(answer), fprintf('Skipped by user: %s\n', name); continue; end
    label = strtrim(answer{1});
    if isempty(label) || strcmpi(label,'unlabelled')
        fprintf('Skipped: a meaningful label is required for %s\n', name); continue;
    end
    url = [char(baseUrl) '/api/recordings/' char(name) '?format=csv'];
    tempFile = [tempname(cfg.rawDir) '.csv'];
    try
        websave(tempFile, url, opts);
        out = convert_recording(tempFile, label, cfg.rawDir);
        delete(tempFile);
        fid = fopen(marker,'w'); fprintf(fid,'%s\n',char(out)); fclose(fid);
        files(end+1,1) = string(out); %#ok<AGROW>
    catch ME
        if isfile(tempFile), delete(tempFile); end
        warning('Could not import %s: %s', name, ME.message);
    end
end
fprintf('Imported %d real recording(s) into %s\n', numel(files), cfg.rawDir);
end
