import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CitizenHeaderComponent } from '../citizen-dashboard/components/citizen-header/citizen-header.component';
import { CitizenFooterComponent } from '../citizen-dashboard/components/citizen-footer/citizen-footer.component';
import { AssistantService } from '../../../core/services/assistant.service';

@Component({
  selector: 'app-public-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CitizenHeaderComponent,
    CitizenFooterComponent
  ],
  templateUrl: './public-about.component.html',
  styleUrl: './public-about.component.css'
})
export class PublicAboutComponent {
  private readonly assistantService = inject(AssistantService);

  openAssistant(): void {
    this.assistantService.openPopup();
  }
}
