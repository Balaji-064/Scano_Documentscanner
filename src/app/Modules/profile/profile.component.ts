import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Define all variables in the class
  rev: string = '';
  profileDetail: any = {};
  phoneNumber: string = '';
  userId: string = '';
  images: string = '';
  file: File | null = null;
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  gender: string = '';
  phone: string = '';
  userName: string = '';
  isDisableEditing: boolean = true;

  constructor(readonly couch: CouchService) {}

  // Lifecycle hook to fetch the user profile on component initialization
  ngOnInit(): void {
    this.userId = localStorage.getItem('userId')!;
    console.log(this.userId);
    this.getProfileDetails();
  }

  // Method to fetch user profile details from the server
  getProfileDetails(): void {
    this.couch.getUserDetailById(this.userId).subscribe({
      next: (response: any) => {
        console.log(response);
        if (response.rows.length > 0) {
          this.profileDetail = response.rows[0].doc;
          this.email = this.profileDetail.data.email;
          this.userName = this.profileDetail.data.userName;
          this.gender = this.profileDetail.data.gender;
          this.phone = this.profileDetail.data.phone;
          this.firstName = this.profileDetail.data.firstName;
          this.lastName = this.profileDetail.data.lastName;
          this.phoneNumber = this.profileDetail.data.phoneNumber;
          this.images = this.profileDetail.data.images;
          this.rev = this.profileDetail._rev;
        }
      },
      error: (err) => {
        console.error('Error fetching profile details', err);
      }
    });
  }

  // Method to handle image change and store the image as base64
  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.images = reader.result as string; // Set image as base64 string
      };
      reader.readAsDataURL(file);
    }
  }

  // Method to save the updated profile details
  saveDetail(): void {
    const updatedData = {
      ...this.profileDetail,
      data: {
        ...this.profileDetail.data,
        gender: this.gender,
        firstName: this.firstName,
        lastName: this.lastName,
        phone: this.phone,
        userName: this.userName,
        images: this.images,
        phoneNumber: this.phoneNumber
      }
    };

    this.couch.profileUpdate(this.profileDetail._id, updatedData, this.rev).subscribe({
      next: () => {
        alert('Profile updated successfully');
        this.getProfileDetails(); // Refresh the profile details
      },
      error: () => {
        alert('Error occurred. Please refresh and try again.');
      }
    });

    this.isDisableEditing = true; // Disable editing after saving
  }

  // Method to enable editing mode
  editProfile(): void {
    this.isDisableEditing = false; // Enable editing
  }
}

