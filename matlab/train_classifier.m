function mdl = train_classifier()
% Session-grouped cross-validation with a shallow decision tree, then export to C++.
cfg = config();
F = readtable(fullfile(cfg.procDir, "features_matlab.csv"));
X = F{:, cellstr(cfg.features)};  y = categorical(string(F.label));  g = string(F.session);
sess = unique(g);
assert(numel(sess) >= 5, "Need at least 5 sessions for grouped CV (have %d).", numel(sess));
cv = cvpartition(numel(sess), "KFold", min(5, numel(sess)));
pred = y;
for k = 1:cv.NumTestSets
    te = ismember(g, sess(test(cv,k)));
    m  = fitctree(X(~te,:), y(~te), "MaxNumSplits", 15, "PredictorNames", cellstr(cfg.features));
    pred(te) = predict(m, X(te,:));
end
figure; confusionchart(y, pred); title("Session-grouped CV (decision tree)");
fprintf("Window accuracy: %.3f\n", mean(pred == y));
mdl = fitctree(X, y, "MaxNumSplits", 15, "PredictorNames", cellstr(cfg.features));
if ~exist(cfg.modelDir,"dir"), mkdir(cfg.modelDir); end
save(fullfile(cfg.modelDir,"tree.mat"), "mdl");
export_tree_cpp(mdl, fullfile(cfg.modelDir,"tree_model.h"));
end
