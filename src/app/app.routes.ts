import { Routes } from '@angular/router';
import { LandingPageComponent } from './Modules/landing-page/landing-page.component';
import { HomePageComponent } from './Modules/home-page/home-page.component';
import { CameraComponent } from './Modules/camera/camera.component';
import { DocxtoPdfComponent } from './Modules/docxto-pdf/docxto-pdf.component';
import { FileHistoryComponent } from './Modules/file-history/file-history.component';
import { FileUploadComponent } from './Modules/file-upload/file-upload.component';
import { ImagetoPdfComponent } from './Modules/imageto-pdf/imageto-pdf.component';
import { LoginPageComponent } from './Modules/login-page/login-page.component';
import { ProfileComponent } from './Modules/profile/profile.component';

import { ChatBotComponent } from './Modules/chat-bot/chat-bot.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    {
        path: 'home', component: HomePageComponent}, {
        path: 'camera', component: CameraComponent
    }, {
        path: 'doc', component: DocxtoPdfComponent
    }, {
        path: 'history', component: FileHistoryComponent
    }, {
        path: 'upload', component: FileUploadComponent
    }, {
        path: 'img', component: ImagetoPdfComponent
    },
    { path: 'login', component: LoginPageComponent },
    {
        path: 'profile', component: ProfileComponent
    },

    { path: 'chat', component: ChatBotComponent }


];
