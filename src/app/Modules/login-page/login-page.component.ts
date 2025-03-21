import { Component, inject } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { v4 as uuidv4 } from 'uuid';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  loginTimes: string = '';
  userName: string = '';
  phoneNumber: string = '';
  loginPassword: string = '';
  userId: string = '';
  confirmPassword: string = '';
  firstName: string = '';
  lastName: string = '';
  newPassword: string = '';
  newConfirmPassword: string = '';
  registrationEmail: string = '';
  loginEmail: string = '';
  flag: boolean = false;
  dob: Date = new Date();
  gender: string = '';
  images: string = '';
  loginDetails: string = '';
  passwordMismatch: boolean = true;
  otpInvalid: boolean = false;
  otpTouched: boolean = false;
  enteredOTP: string = '';
  generatedOTP: string | null= '';
  routerVariable = inject(Router);

  // Flags for form toggling
  showRegistrationPage: boolean = false;
  showLoginPage: boolean = true;
  showForgotPasswordPage: boolean = false;
  showOTPPage: boolean = false;
  showNewPasswordPage: boolean = false;
  registerPassword: string = '';

  constructor(readonly couchService: CouchService) { }

  // Generate Unique IDs
  private generateUuid(): void {
    this.userId = `user_2_${uuidv4()}`;
    console.log('Generated User ID:', this.userId);
  }

  private generateUuidLogin(): void {
    this.loginTimes = `logindetails_2_${uuidv4()}`;
    console.log('Generated Login ID:', this.loginTimes);
  }

  private generateUuidLoginDetails(): void {
    this.loginDetails = uuidv4();
  }

  // Form Toggling Methods
  showRegistrationForm(): void {
    this.showRegistrationPage = true;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showLoginForm(): void {
    this.showRegistrationPage = false;
    this.showLoginPage = true;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showForgotPasswordForm(): void {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = true;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showOTPForm(): void {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = true;
    this.showNewPasswordPage = false;
  }

  showNewPasswordForm(): void {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = true;
  }

  // User Registration
  create(): void {

    this.couchService.validateUserByEmail(this.registrationEmail).subscribe({
      next: (response: any) => {
        console.log(response);

        const emailExists = response.rows.some((e: any) => e.value);

        if (emailExists) {
          alert('The email address is already in use. Please use a different email.');
        } else {
          this.generateUuid();
          this.generateUuidLoginDetails();
          const hashedPassword = CryptoJS.SHA256(this.registerPassword).toString(CryptoJS.enc.Base64);
          console.log(hashedPassword)
          const data: any = {
            _id: this.userId,
            data: {
              userName: this.userName,
              phoneNumber: this.phoneNumber,
              email: this.registrationEmail,
              password: hashedPassword,
              dob: this.dob,
              images: this.images,
              gender: this.gender,
              loginDetails: this.registrationEmail,
              firstName: this.firstName,
              lastName: this.lastName,
              type: 'users',
            }
          };

          this.couchService.addUser(data).subscribe({
            next: () => {
              alert('Registered successfully');
              this.resetForm();
              this.showLoginForm();
            },
            error: () => alert('Error occurred during registration'),
          });
        }
      },
      error: () => alert('Error occurred while verifying user'),
    });
  }

  // User Login
  login(): void {
    this.generateUuidLogin();
    const hashedLoginPassword = CryptoJS.SHA256(this.loginPassword).toString(CryptoJS.enc.Base64);
    console.log(hashedLoginPassword)
    const loginDetails: any = {
      _id: this.loginTimes,
      data: {
        loginDetails: this.loginEmail,
        dob: this.dob,
        type: 'logindetails',
      },
    };

    this.couchService.validateUserByEmail(this.loginEmail).subscribe({
      next: (response: any) => {
        const user = response.rows.find((e: any) => e.value.data.email === this.loginEmail && e.value.data.password === hashedLoginPassword);

        if (user) {
          this.userId = user.value._id;
          localStorage.setItem('userId', this.userId);
          this.couchService.addLoginDetails(loginDetails).subscribe({
            next: () => { },
            error: () => alert('Error occurred while adding login details'),
          });
          alert('Login successful');
          this.routerVariable.navigate(['home']);
        } else {
          alert('Login failed');
        }
      },
      error: () => alert('Error occurred while verifying user'),
    });
  }

  // Generate OTP for Forgot Password
  generateOTP() {
    this.couchService.validateUserByEmail(this.loginEmail).subscribe({
      next: (response: any) => {
        if (response.rows.length > 0) {
          const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
          alert(`Your OTP is: ${otp}`); // Display OTP in alert
          this.generatedOTP = otp;
          
        // Set the OTP expiry timeout (e.g., 5 minutes)
        const otpTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Set the timeout to disable the OTP after the specified period
        setTimeout(() => {
          this.generatedOTP = null; // Clear the OTP after timeout
          alert("Your OTP has expired. Please request a new one.");
        }, otpTimeout);

        this.showOTPForm();
         
        }
        else {
          alert("Email not found")
        }
      }
    })
  }


  // Verify OTP for Forgot Password
  verifyOTP(): void {
    if (this.enteredOTP === this.generatedOTP) {
      this.showNewPasswordForm(); // Show new password form
      this.enteredOTP = '';
    }
  }

  // Reset Password
  resetPassword(): void {
    if (this.newPassword === this.newConfirmPassword) {
      const hashedNewPassword = CryptoJS.SHA256(this.newPassword).toString(CryptoJS.enc.Base64);
      console.log("Hashed New Password: ", hashedNewPassword);
      this.couchService.validateUserByEmail(this.loginEmail).subscribe({
        next: (response: any) => {
          console.log(response.rows[0].value)
          const existData = response.rows[0].value;
          if (existData) {
            const updatedData = { ...existData, data: { ...existData.data, password: hashedNewPassword } };

            this.couchService.updatePassword(existData._id, updatedData).subscribe({
              next: () => {
                alert('Password reset successful');
                this.showLoginPage = true;
                this.showNewPasswordPage = false;

              },
              error: () => alert('Error occurred while resetting the password'),
            });
          }
        },
        error: () => alert('Error occurred while fetching user details'),
      });
    } else {
      this.passwordMismatch = true;
    }
  }

  // Reset Form
  resetForm(): void {
    this.userName = '';
    this.registrationEmail = '';
    this.registerPassword = '';
    this.confirmPassword = '';
    this.phoneNumber = '';
    this.gender = '';
    this.images = '';
    this.loginEmail = '';
    this.loginPassword = '';
  }
}