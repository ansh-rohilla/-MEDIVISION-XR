{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.flask
    pkgs.python310Packages.flask-cors
  ];
  env = {
    PYTHONUNBUFFERED = "1";
  };
  scripts = {
    start = "python public_backend.py";
  };
}
