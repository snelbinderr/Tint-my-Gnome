import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TintMyGnomePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();

        // 1. Settings Group
        const settingsGroup = new Adw.PreferencesGroup({
            title: 'Settings',
        });
        page.add(settingsGroup);

        const flatpakRow = new Adw.ActionRow({
            title: 'Apply GTK theme to Flatpaks',
            subtitle: 'Runs flatpak override to grant access to gtk-4.0 and the extension directory',
        });

        const flatpakButton = new Gtk.Button({
            label: 'Apply',
            valign: Gtk.Align.CENTER,
        });

        flatpakButton.connect('clicked', () => {
            const cmd = [
                'flatpak',
                'override',
                '--user',
                '--filesystem=xdg-config/gtk-4.0:ro',
                `--filesystem=${this.dir.get_path()}:ro`
            ];

            try {
                const proc = Gio.Subprocess.new(cmd, Gio.SubprocessFlags.NONE);
                proc.wait_check_async(null, (obj, res) => {
                    try {
                        obj.wait_check_finish(res);
                        // Optionally provide visual feedback here
                        flatpakButton.set_label('Applied!');
                        flatpakButton.set_sensitive(false);

                        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
                            flatpakButton.set_label('Apply');
                            flatpakButton.set_sensitive(true);
                            return GLib.SOURCE_REMOVE;
                        });

                    } catch (e) {
                        console.error(`[Tint my Gnome] Flatpak override error: ${e.message}`);
                    }
                });
            } catch (e) {
                console.error(`[Tint my Gnome] Failed to spawn flatpak subprocess: ${e.message}`);
            }
        });

        flatpakRow.add_suffix(flatpakButton);
        flatpakRow.activatable_widget = flatpakButton;

        settingsGroup.add(flatpakRow);

        // 2. Donate Group
        const donateGroup = new Adw.PreferencesGroup({
            title: 'Donate',
        });
        page.add(donateGroup);

        const donateText = new Gtk.Label({
            label: 'Send some Bitcoin over Lightning to: pakovm@getalby.com',
            justify: Gtk.Justification.CENTER,
            wrap: true,
            margin_bottom: 12,
        });
        donateGroup.add(donateText);

        const assetPath = this.dir.get_child('assets').get_child('lightning-address.png').get_path();
        const qrImage = Gtk.Picture.new_for_filename(assetPath);
        
        // Allow the image to shrink gracefully
        qrImage.can_shrink = true;
        // Keep it centered horizontally
        qrImage.halign = Gtk.Align.CENTER;
        // Ensure it preserves aspect ratio and only scales down, never up (GTK 4.8+)
        qrImage.content_fit = Gtk.ContentFit.SCALE_DOWN;

        donateGroup.add(qrImage);

        // Add page to window
        window.add(page);
    }
}
