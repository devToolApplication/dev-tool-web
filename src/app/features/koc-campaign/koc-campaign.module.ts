import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@shared/shared.module';
import { kocCampaignRoutes } from './koc-campaign.routes';
import { KocCampaignListComponent } from './pages/koc-campaign-list/koc-campaign-list.component';

@NgModule({
  declarations: [KocCampaignListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(kocCampaignRoutes),
    SharedModule,
  ],
  exports: [KocCampaignListComponent],
})
export class KocCampaignModule {}
