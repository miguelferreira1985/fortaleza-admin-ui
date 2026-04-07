import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';
import { CurrentUser } from '../../../shared/models/current-user';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../../../features/change-password-dialog.component/change-password-dialog.component';

@Component({
  selector: 'app-main-layout.component',
  imports: [
    CommonModule,
    RouterOutlet,
    MaterialModule,
    RouterLink,
    RouterLinkActive,
    HasRoleDirective
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {

  @ViewChild('sidenav') sidenav!: MatSidenav;

  private autService = inject(AuthService);
  private dialog = inject(MatDialog);

  currentUser: CurrentUser | null = null;
  expandedSection: string | null = 'inventory';

  ngOnInit(): void {
    this,this.currentUser = this.autService.getCurrentUser();
  }

  toggleSection(section: string): void {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSection === section;
  }

  openChangePasswordDialog(): void {
    const user = this.currentUser;

    if (!user) return;

    this.dialog.open(ChangePasswordDialogComponent, {
    width: '480px',
    data: {
      username: user.username,
      userId: user.id
    },
    disableClose: true
  });
  }

  logout(): void {
    this.autService.logout();
  }

}
