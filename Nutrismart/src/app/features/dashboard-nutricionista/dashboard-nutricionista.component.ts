import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-nutricionista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-nutricionista.component.html',
  styleUrls: ['./dashboard-nutricionista.component.scss']
})
export class DashboardNutricionistaComponent {}
