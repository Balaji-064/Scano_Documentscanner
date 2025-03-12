import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from "@angular/router";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Scano';
  isModalOpen: boolean=false;
  logout: boolean=false;

  openModal() {
 
    console.log("inside the openmodal");
    this.isModalOpen = true;
    this.logout=true
  }
  
  // Method to close the modal
  closeModal() {
    this.isModalOpen = false;
    this.logout=false;
  }
}
