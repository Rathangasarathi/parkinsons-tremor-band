function analyse_session(file)
% Plots for one session: signal, spectrogram, dominant frequency.
cfg = config();  S = load_session(file, cfg);  F = extract_features(S, cfg);
am = vecnorm(S.acc,2,2);  am = am - mean(am);
[bb,aa] = butter(4, cfg.band/(S.fs/2), "bandpass");  y = filtfilt(bb,aa,am);
N = round(cfg.winSec*S.fs);  H = round(cfg.hopSec*S.fs);
figure("Name", S.session);  tiledlayout(3,1);
nexttile; plot(S.t, am); ylabel("g"); title("Acceleration magnitude (mean removed) - " + S.label);
nexttile; spectrogram(y, hann(N), N-H, cfg.nfft, S.fs, "yaxis"); ylim([0 15]); title("Spectrogram");
nexttile; plot(F.t, F.domfreq, "-o"); ylabel("Hz"); xlabel("s"); title("Dominant frequency (3-12 Hz)");
end
