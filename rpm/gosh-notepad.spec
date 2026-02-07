%global debug_package %{nil}
Name:           gosh-notepad
Version:        3.1.2
Release:        1%{?dist}
Summary:        A Windows 95/98 Notepad clone built with Electron
License:        MIT
URL:            https://github.com/goshitsarch-eng/gosh-notepad-cloned
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  nodejs >= 20
BuildRequires:  npm
Requires:       electron

%description
A faithful Windows 95/98 Notepad clone with dark mode, find & replace,
font customization, and all the classic keyboard shortcuts. Built with
Electron, React, and 98.css.

%prep
%setup -q

%build
npm install
npx vite build

%install
rm -rf %{buildroot}

# App files
install -dm 755 %{buildroot}%{_libdir}/%{name}
cp -r dist electron package.json %{buildroot}%{_libdir}/%{name}/
cd %{buildroot}%{_libdir}/%{name}
cp %{_builddir}/%{name}-%{version}/package.json .
npm install --omit=dev --ignore-scripts
cd -

# Launcher
install -Dm 755 /dev/stdin %{buildroot}%{_bindir}/%{name} <<'EOF'
#!/bin/sh
exec electron %{_libdir}/gosh-notepad/electron/main.js "$@"
EOF

# Desktop entry
install -Dm 644 /dev/stdin %{buildroot}%{_datadir}/applications/%{name}.desktop <<'EOF'
[Desktop Entry]
Name=Notepad
Comment=Windows 95/98 Notepad Clone
Exec=gosh-notepad %%F
Icon=gosh-notepad
Terminal=false
Type=Application
Categories=Utility;TextEditor;
MimeType=text/plain;text/x-log;
Keywords=text;editor;notepad;
StartupWMClass=gosh-notepad
EOF

# Icon
install -Dm 644 assets/icons/icon.png %{buildroot}%{_datadir}/icons/hicolor/256x256/apps/%{name}.png

%files
%license LICENSE
%{_bindir}/%{name}
%{_libdir}/%{name}/
%{_datadir}/applications/%{name}.desktop
%{_datadir}/icons/hicolor/256x256/apps/%{name}.png

%changelog
* Sat Feb 07 2026 Goshitsarch <goshitsarch@users.noreply.github.com> - 3.1.2-1
- Bump to v3.1.2
- Require Node.js >= 20
- Fix license and metadata consistency

* Fri Jan 31 2025 Goshitsarch <goshitsarch@users.noreply.github.com> - 2.0.1-1
- Migrated from Tauri/Svelte to Electron/React
- Dark mode enabled by default
- Added right-click context menu
- Auto-update support via electron-updater
