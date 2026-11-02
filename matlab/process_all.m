function F = process_all()
% Batch: every CSV in data/raw -> one feature table -> data/processed/features_matlab.csv
cfg = config();
files = dir(fullfile(cfg.rawDir, "*.csv"));
F = table();
for k = 1:numel(files)
    S = load_session(fullfile(files(k).folder, files(k).name), cfg);
    fprintf("%-34s fs=%.2f Hz  maxGap=%.1f ms  jitter=%.2f ms  sat=%.4f\n", files(k).name, ...
            S.fs, 1e3*S.maxGap, 1e3*S.jitter, S.satFrac);
    if S.maxGap > 3/S.fs, warning("Gaps in %s: check serial rate / I2C", files(k).name); end
    F = [F; extract_features(S, cfg)]; %#ok<AGROW>
end
if ~exist(cfg.procDir,"dir"), mkdir(cfg.procDir); end
writetable(F, fullfile(cfg.procDir, "features_matlab.csv"));
fprintf("%d windows from %d sessions saved.\n", height(F), numel(files));
end
