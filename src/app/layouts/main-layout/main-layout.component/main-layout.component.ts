import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout'
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';
import { CurrentUser } from '../../../shared/models/current-user';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../../../features/change-password-dialog.component/change-password-dialog.component';
import { filter, Subscription } from 'rxjs';
import { dialogConfig } from '../../../core/utils/dialog.util';

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
export class MainLayoutComponent implements OnInit, OnDestroy {

  @ViewChild('sidenav') sidenav!: MatSidenav;

  private autService = inject(AuthService);
  private dialog = inject(MatDialog);
  private breakpoint = inject(BreakpointObserver);
  private router = inject(Router);

  private subs = new Subscription();

  currentUser: CurrentUser | null = null;
  expandedSection = new Set<string>(['pos']);

  isMobile = false;

  ngOnInit(): void {
    this.currentUser = this.autService.getCurrentUser();

    this.subs.add(
      this.breakpoint.observe('(max-width: 599px)').subscribe(
        result => {
          this.isMobile = result.matches;
          if (!this.isMobile && this.sidenav) {
            this.sidenav.open();
          }
        })
    );

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          if (this.isMobile && this.sidenav?.opened) {
            this.sidenav.close();
          }
        })
    )
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleSection(section: string): void {
    if (this.expandedSection.has(section)) {
      this.expandedSection.delete(section);
    } else {
      this.expandedSection.add(section);
    }
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSection.has(section);
  }

  openChangePasswordDialog(): void {
    const user = this.currentUser;

    if (!user) return;

    this.dialog.open(ChangePasswordDialogComponent,
      dialogConfig('480px', {
        data: {
          username: user.username,
          userId: user.id
        },
        disableClose: true
      })
    );
  }

  logout(): void {
    this.autService.logout();
  }

}
