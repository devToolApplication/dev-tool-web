import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { KocCampaignService } from './koc-campaign.service';
import { environment } from '../../../../enviroment/environment';
import { KocCampaignCreateRequest, KocCampaignItem, KocCandidateItem } from '../models/koc-campaign.model';

describe('KocCampaignService', () => {
  let service: KocCampaignService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.adminAiGenerator}/koc-campaigns`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KocCampaignService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(KocCampaignService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get campaign page with filter params', () => {
    const mockCampaign: KocCampaignItem = {
      id: 'camp-1',
      name: 'Summer Tech Review',
      niche: 'TECH',
      targetCount: 5,
      minScore: 75.0,
      workflowStatus: 'RUNNING',
    };

    service.getCampaignPage({ page: 0, size: 10, niche: 'TECH', workflowStatus: 'RUNNING' }).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe('Summer Tech Review');
    });

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/page` && r.params.get('niche') === 'TECH');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { data: [mockCampaign], metadata: { totalElements: 1, pageNumber: 0, pageSize: 10 } } });
  });

  it('should get campaign by id', () => {
    const mockCampaign: KocCampaignItem = {
      id: 'camp-1',
      name: 'Summer Tech Review',
    };

    service.getCampaignById('camp-1').subscribe((res) => {
      expect(res.id).toBe('camp-1');
      expect(res.name).toBe('Summer Tech Review');
    });

    const req = httpMock.expectOne(`${baseUrl}/camp-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockCampaign });
  });

  it('should get campaign approved candidates', () => {
    const mockCandidates: KocCandidateItem[] = [
      {
        id: 'cand-1',
        campaignId: 'camp-1',
        externalProfileId: 'fb-101',
        fullName: 'KOC A',
        platform: 'FACEBOOK',
        followerCount: 50000,
        score: 85.0,
      },
    ];

    service.getCampaignCandidates('camp-1').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].fullName).toBe('KOC A');
    });

    const req = httpMock.expectOne(`${baseUrl}/camp-1/candidates`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockCandidates });
  });

  it('should create and start campaign', () => {
    const createReq: KocCampaignCreateRequest = {
      name: 'New Campaign',
      niche: 'LIFESTYLE',
      targetCount: 3,
      minScore: 70.0,
      searchPrompt: 'Search prompt',
      reviewPrompt: 'Review prompt',
    };

    const mockResponse: KocCampaignItem = {
      id: 'camp-new',
      name: 'New Campaign',
      workflowStatus: 'RUNNING',
    };

    service.createAndStartCampaign(createReq).subscribe((res) => {
      expect(res.id).toBe('camp-new');
      expect(res.workflowStatus).toBe('RUNNING');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('New Campaign');
    req.flush({ success: true, data: mockResponse });
  });

  it('should update campaign', () => {
    service.updateCampaign('camp-1', { name: 'Updated Name' }).subscribe((res) => {
      expect(res.name).toBe('Updated Name');
    });

    const req = httpMock.expectOne(`${baseUrl}/camp-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: { id: 'camp-1', name: 'Updated Name' } });
  });

  it('should delete campaign', () => {
    service.deleteCampaign('camp-1').subscribe((res) => {
      expect(res.id).toBe('camp-1');
    });

    const req = httpMock.expectOne(`${baseUrl}/camp-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: { id: 'camp-1' } });
  });

  it('should clone campaign', () => {
    const cloneReq = { name: '(Bản sao) Summer Tech Review' };
    const mockCloned: KocCampaignItem = {
      id: 'camp-cloned',
      name: '(Bản sao) Summer Tech Review',
      workflowStatus: 'RUNNING',
    };

    service.cloneCampaign('camp-1', cloneReq).subscribe((res) => {
      expect(res.id).toBe('camp-cloned');
      expect(res.name).toBe('(Bản sao) Summer Tech Review');
      expect(res.workflowStatus).toBe('RUNNING');
    });

    const req = httpMock.expectOne(`${baseUrl}/camp-1/clone`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('(Bản sao) Summer Tech Review');
    req.flush({ success: true, data: mockCloned });
  });

});
