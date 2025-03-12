import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  slideIndex = 0;
  slides: HTMLElement[] = [];
  dots: HTMLElement[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    this.initializeSlides();
    this.showSlides();
  }

  initializeSlides(): void {
    this.slides = Array.from(document.getElementsByClassName('mySlides')) as HTMLElement[];
    this.dots = Array.from(document.getElementsByClassName('dot')) as HTMLElement[];
  }
  showSlides(): void {
    if (this.slides.length === 0 || this.dots.length === 0) return;

    // Hide all slides
    this.slides.forEach(slide => (slide.style.display = 'none'));

    // Remove active class from all dots
    this.dots.forEach(dot => dot.classList.remove('active'));
    // Increment slideIndex and reset if necessary
    this.slideIndex++;
    if (this.slideIndex > this.slides.length) {
      this.slideIndex = 1;
    }
    // Display the current slide and mark the corresponding dot
    this.slides[this.slideIndex - 1].style.display = 'flex';
    this.dots[this.slideIndex - 1].classList.add('active');

    // Change slide every 5 seconds
    setTimeout(() => this.showSlides(), 5000);
  }
}
