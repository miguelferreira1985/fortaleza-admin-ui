import { Directive, Input, TemplateRef, ViewContainerRef } from "@angular/core";
import { AuthService } from "../services/auth.service";

@Directive({
    selector: '[hasRole]'
})
export class HasRoleDirective {
    private roles: string[] = [];

    constructor(
        private templeteRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private authService: AuthService
    ) {}

    @Input()
    set hasRole(role: string | string[]) {
        this.roles = Array.isArray(role) ? role : [role];
        this.updateView();
    }

    private updateView(): void {
        const userRoles = this.authService.getUserRoles();

        const hasPermission = this.roles.some(r => userRoles.includes(r));

        if (hasPermission) {
            this.viewContainer.createEmbeddedView(this.templeteRef);
        } else {
            this.viewContainer.clear();
        }
    }

}