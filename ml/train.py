"""Session-grouped CV for three models, then export a shallow tree as C++.
usage: python ml/train.py [features_csv]"""
import sys, os, joblib
import numpy as np, pandas as pd
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from features import FEATURES

csv = sys.argv[1] if len(sys.argv) > 1 else "data/processed/features_py.csv"
df = pd.read_csv(csv)
X, y, g = df[FEATURES].to_numpy(), df["label"].to_numpy(), df["session"].to_numpy()
n_sess = len(np.unique(g))
assert n_sess >= 5, f"need >= 5 sessions for grouped CV, have {n_sess}"
cv = GroupKFold(n_splits=min(5, n_sess))

models = {
    "logistic":      make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced")),
    "tree(depth 4)": DecisionTreeClassifier(max_depth=4, class_weight="balanced", random_state=0),
    "random forest": RandomForestClassifier(n_estimators=200, class_weight="balanced", random_state=0),
}
for name, m in models.items():
    pred = cross_val_predict(m, X, y, groups=g, cv=cv)
    print(f"\n=== {name} ===  window accuracy {np.mean(pred == y):.3f}")
    print(classification_report(y, pred, zero_division=0))
    print(pd.DataFrame(confusion_matrix(y, pred, labels=np.unique(y)), index=np.unique(y), columns=np.unique(y)))

tree = models["tree(depth 4)"].fit(X, y)
os.makedirs("models", exist_ok=True)
joblib.dump(tree, "models/tree_py.joblib")

def export_c(t, feats, path):
    tr, classes = t.tree_, t.classes_
    L = [f"// auto-generated. feature order: {', '.join(feats)}", f"// classes: {', '.join(classes)}",
         "inline int predict_tree(const float* x) {"]
    def rec(n, d):
        pad = "  " * d
        if tr.children_left[n] != -1:
            L.append(f"{pad}if (x[{tr.feature[n]}] <= {tr.threshold[n]:.7g}f) {{")
            rec(tr.children_left[n], d + 1); L.append(f"{pad}}} else {{")
            rec(tr.children_right[n], d + 1); L.append(f"{pad}}}")
        else:
            k = int(np.argmax(tr.value[n])); L.append(f"{pad}return {k};  // {classes[k]}")
    rec(0, 1); L.append("}")
    open(path, "w").write("\n".join(L) + "\n")
export_c(tree, FEATURES, "models/tree_model_py.h")
print("\nsaved models/tree_py.joblib and models/tree_model_py.h")
