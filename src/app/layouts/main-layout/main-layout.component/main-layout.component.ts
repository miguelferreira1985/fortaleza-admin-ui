import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MaterialModule } from '../../../shared/material-module';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '../../../core/services/auth.service';
import { CurrentUser } from '../../../shared/models/current-user';

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

  logout(): void {
    this.autService.logout();
  }

}
