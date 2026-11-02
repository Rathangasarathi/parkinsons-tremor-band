function S = load_session(file, cfg)
% Reads one CSV (seq,t_us,ax,ay,az,gx,gy,gz). Filename: YYYYMMDD_HHMMSS_label.csv (no '_' in label).
T  = readtable(file);
t  = T.t_us;
t  = t + [0; cumsum(diff(t) < 0)] * 2^32;          % unwrap 32-bit microsecond counter
t  = (t - t(1)) / 1e6;
dt = diff(t);
S.t = t;  S.fs = 1/median(dt);  S.maxGap = max(dt);  S.jitter = std(dt);
S.acc = [T.ax T.ay T.az] / cfg.accScale;            % g
S.gyr = [T.gx T.gy T.gz] / cfg.gyrScale;            % deg/s
[~, name] = fileparts(file);
tok = split(string(name), "_");
S.session = string(name);  S.label = tok(end);
S.satFrac = mean(abs([T.ax T.ay T.az T.gx T.gy T.gz]) >= 32767, 'all');   % saturation check
end
