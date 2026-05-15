import { MatDialogConfig } from "@angular/material/dialog";

/**
 * Genera la configuración responsiva para MatDialog.
 * En móvil (<600px) el dialog ocupa casi toda la pantalla.
 * En desktop/tablet respeta el width que le pases.
 *
 * Uso:
 *   this.dialog.open(MiDialog, dialogConfig('500px', { data: miData }));
 */
export function dialogConfig<T>(
  desktopWidth: string,
  extra?: Partial<MatDialogConfig<T>>
): MatDialogConfig<T> {
  const isMobile = window.innerWidth < 600;

  return {
    width: isMobile ? '95vw' : desktopWidth,
    maxWidth: '95vw',
    ...extra
  };
}
