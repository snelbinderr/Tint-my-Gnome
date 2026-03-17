import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class TintMyGnomeExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        // Setup GTK4 styling backup & symlink
        const configDir = GLib.get_user_config_dir();
        const gtk4Dir = Gio.File.new_for_path(GLib.build_filenamev([configDir, 'gtk-4.0']));

        try {
            if (!gtk4Dir.query_exists(null)) {
                gtk4Dir.make_directory_with_parents(null);
            }
        } catch (e) {
            console.error(`[Tint my Gnome] Could not create gtk-4.0 dir: ${e.message}`);
        }

        const userGtkCss = gtk4Dir.get_child('gtk.css');
        const userGtkCssBackup = gtk4Dir.get_child('gtk.css.backup');
        const extensionGtkCss = this.dir.get_child('gtk-4.0').get_child('gtk.css');

        let info;
        try {
            info = userGtkCss.query_info(
                Gio.FILE_ATTRIBUTE_STANDARD_SYMLINK_TARGET + ',' + Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
                null
            );
        } catch (e) {
            // File might not exist
        }

        try {
            if (info) {
                const isOurSymlink = info.get_symlink_target() === extensionGtkCss.get_path();

                if (!isOurSymlink) {
                    if (userGtkCssBackup.query_exists(null)) {
                        userGtkCssBackup.delete(null);
                    }
                    userGtkCss.move(userGtkCssBackup, Gio.FileCopyFlags.OVERWRITE, null, null);
                } else {
                    userGtkCss.delete(null);
                }
            }

            userGtkCss.make_symbolic_link(extensionGtkCss.get_path(), null);
        } catch (e) {
            console.error(`[Tint my Gnome] Error setting up GTK4 CSS: ${e.message}`);
        }
    }

    disable() {

        // Restore GTK4 styling from backup
        const configDir = GLib.get_user_config_dir();
        const gtk4Dir = Gio.File.new_for_path(GLib.build_filenamev([configDir, 'gtk-4.0']));
        const userGtkCss = gtk4Dir.get_child('gtk.css');
        const userGtkCssBackup = gtk4Dir.get_child('gtk.css.backup');
        const extensionGtkCss = this.dir.get_child('gtk-4.0').get_child('gtk.css');

        let info;
        try {
            info = userGtkCss.query_info(
                Gio.FILE_ATTRIBUTE_STANDARD_SYMLINK_TARGET,
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
                null
            );
        } catch (e) {
            // File might not exist
        }

        try {
            if (info) {
                if (info.get_symlink_target() === extensionGtkCss.get_path()) {
                    userGtkCss.delete(null);
                }
            }

            let backupInfo;
            try {
                backupInfo = userGtkCssBackup.query_info(
                    Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
                    Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
                    null
                );
            } catch (e) { }

            if (backupInfo) {
                userGtkCssBackup.move(userGtkCss, Gio.FileCopyFlags.OVERWRITE, null, null);
            }
        } catch (e) {
            console.error(`[Tint my Gnome] Error restoring GTK4 CSS: ${e.message}`);
        }
    }

}
