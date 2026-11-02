function th = derive_thresholds(posLabel)
% Data-driven starting point for the Tremor-like Movement Index (0-4).
% NOT clinical. Positive class = windows labelled posLabel (default "tremor", i.e. simulated tremor).
if nargin < 1, posLabel = "tremor"; end
cfg = config();
F = readtable(fullfile(cfg.procDir, "features_matlab.csv"));
pos = string(F.label) == posLabel;
fprintf("positive windows: %d, negative: %d\n", sum(pos), sum(~pos));
best = struct("auc",-inf);
for f = cfg.features
    [x,y,thr,auc] = perfcurve(pos, F.(f), true);
    [~,i] = max(y - x);                              % Youden J
    fprintf("%-10s AUC=%.3f  Youden threshold=%.4g\n", f, auc, thr(i));
    if auc > best.auc, best = struct("feature",f,"auc",auc,"thr",thr(i)); end
end
% index levels: 0 below T1; levels 1-4 split by quartiles of the primary feature among windows above T1
v = F.(best.feature)(pos & F.(best.feature) >= best.thr);
q = quantile(v, [0.25 0.5 0.75]);
th = struct("feature", best.feature, "T1", best.thr, "levels", [best.thr q], "auc", best.auc, ...
            "version", "v1-" + string(datetime("today","Format","yyyyMMdd")), ...
            "note", "Prototype movement index. Not a clinical scale.");
if ~exist(cfg.modelDir,"dir"), mkdir(cfg.modelDir); end
fid = fopen(fullfile(cfg.modelDir,"thresholds.json"),"w"); fprintf(fid, "%s", jsonencode(th,"PrettyPrint",true)); fclose(fid);
fid = fopen(fullfile(cfg.modelDir,"thresholds.h"),"w");
fprintf(fid, "// auto-generated %s, feature: %s\n", th.version, th.feature);
fprintf(fid, "const float IDX_LEVELS[4] = {%.6gf, %.6gf, %.6gf, %.6gf};\n", th.levels);
fclose(fid);
end
