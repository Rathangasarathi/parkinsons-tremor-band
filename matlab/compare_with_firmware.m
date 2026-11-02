function compare_with_firmware(F, W)
% F: MATLAB feature table (t, domfreq, rms_acc, ...). W: firmware log table with columns t, domfreq, rms_acc
% (same window length/hop, same time base). Plots differences; fix firmware until within tolerance.
vars = ["domfreq","rms_acc"];
figure; tiledlayout(numel(vars),2);
for v = vars
    fw = interp1(W.t, W.(v), F.t, "nearest", "extrap");
    d  = fw - F.(v);
    nexttile; plot(F.t, F.(v), F.t, fw); legend("MATLAB","firmware"); title(v);
    nexttile; plot(F.t, d); yline(0); title(v + " difference (firmware - MATLAB)");
    fprintf("%s: mean diff %.4g, max |diff| %.4g\n", v, mean(d,"omitnan"), max(abs(d)));
end
end
