import { Injectable } from "@angular/core";
import Swal from "sweetalert2";

@Injectable({ providedIn: 'root'})
export class NotificationService {
    private toast = Swal.mixin({
        toast: true,
        position: 'top-right',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true
    });

    success(title: string, text?: string) { return Swal.fire({ icon: 'success', title, text }); }
    error(title: string, text?: string) { return Swal.fire({ icon: 'error', title, text }); }
    info(title: string, text?: string) { return Swal.fire({ icon: 'info', title, text }); }
    warning(title: string, text?: string) { return Swal.fire({ icon: 'warning', title, text }); }
  
    toastSuccess(message: string) { return this.toast.fire({ icon: 'success', title: message }); }
    toastError(message: string) { return this.toast.fire({ icon: 'error', title: message }); }
    toastInfo(message: string) { return this.toast.fire({ icon: 'info', title: message }); }

    confirm(title: string, text?: string) {
        return Swal.fire({
            title, text, icon: 'warning',
            showConfirmButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No', showCancelButton: true
        });
    }

}