import { Component, inject } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  images: string = ''
  userId:string=''
  profileDetail:any=[]
  isModalOpen:boolean=false
  logout: boolean=false;
router=inject(Router)
  constructor(readonly couch:CouchService){}
  ngOnInit(){
    this.userId = localStorage.getItem("userId")!
    console.log(this.userId);

    console.log(this.userId)
    this.couch.getUserDetailById(this.userId).subscribe({
      next: (response: any) => {
        console.log(response)
        this.profileDetail = response.rows[0].doc
        this.images = this.profileDetail.data.images
      }
    });
  }
 
   openModal() {
   this.isModalOpen = true;
  }
  
  // Method to close the modal
  closeModal() {
    this.isModalOpen = false;
    this.logout=false;
  }
  logOut() {
    // Perform logout logic (e.g., clear session, navigate to login)
    console.log('User logged out');
    this.isModalOpen = false;
    localStorage.clear()
    this.router.navigate(['/login']); // Redirect to login page
  }

}
