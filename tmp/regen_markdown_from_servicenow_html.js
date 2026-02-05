const { JSDOM } = require('jsdom');

const html = `
<div class="body conbody"><p class="shortdesc">View the current information about open incidents as a list, or as a heatmap or pivot table organized by breakdown.</p>
      <div class="p">
         <div class="note important note_important"><span class="note__title">Important:</span> <div class="note__body">
            <p class="p">Starting in <span class="ph">Xanadu</span> release, the Open Incidents Reports dashboard is deprecated. Users can use <a class="xref ft-internal-link" href="https://www.servicenow.com/docs/r/MlbQAgTiiiMOLOw9T36wJg/vFp4O3cbdP5t1T8elq1y6A" title="Dashboard providing a view into process metrics related to Open and Closed incidents." data-ft-click-interceptor="ft-internal-link">Incident management dashboard</a> to view the current information about open incidents as a list, or as a heatmap or pivot table organized by breakdown.</p>
         </div></div>
      </div>
      <figure class="fig fignone" id="open-incidents-reports-dashboard__fig_n1f_y2p_blb"><figcaption><span class="fig--title-label">Figure 1. </span>Tabs of the Open Incidents Reports dashboard</figcaption>
         
         
         <a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/O3VZQvy4F6Agk5KUotiB9A-MlbQAgTiiiMOLOw9T36wJg" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="O3VZQvy4F6Agk5KUotiB9A-MlbQAgTiiiMOLOw9T36wJg"><img class="image ft-zoomable-image ft-responsive-image" id="open-incidents-reports-dashboard__image_g33_gyn_nlb" alt="Animated gif taking you through the tabs of the Incident Premium - Open Incidents Reports dashboard" src="https://www.servicenow.com/docs/api/khub/maps/MlbQAgTiiiMOLOw9T36wJg/resources/O3VZQvy4F6Agk5KUotiB9A-MlbQAgTiiiMOLOw9T36wJg/content?v=738e97845126a442&amp;Ft-Calling-App=ft/turnkey-portal" data-ft-click-interceptor="ft-img-zoom" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="O3VZQvy4F6Agk5KUotiB9A-MlbQAgTiiiMOLOw9T36wJg"></a>
      </figure>
      
      
      <section class="section" id="open-incidents-reports-dashboard__section_upb_qj4_2fb"><h2 class="title sectiontitle">End user and roles</h2>
         
         <div class="p">
            <table class="table frame-all" id="open-incidents-reports-dashboard__table_ov2_tj4_2fb"><caption></caption><colgroup><col style="width:33.33333333333333%"><col style="width:33.33333333333333%"><col style="width:33.33333333333333%"></colgroup><thead class="thead">
                     <tr class="row">
                        <th class="entry colsep-1 rowsep-1" id="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__1">End user and goal</th>
                        <th class="entry colsep-1 rowsep-1" id="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__2">Required role</th>
                        <th class="entry rowsep-1" id="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__3">Benefits</th>
                     </tr>
                  </thead><tbody class="tbody">
                     <tr class="row">
                        <td class="entry colsep-1 rowsep-1" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__1"></td>
                        <td class="entry colsep-1 rowsep-1" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__2"></td>
                        <td class="entry rowsep-1" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__3"></td>
                     </tr>
                     <tr class="row">
                        <td class="entry colsep-1" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__1"></td>
                        <td class="entry colsep-1" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__2"></td>
                        <td class="entry" headers="open-incidents-reports-dashboard__table_ov2_tj4_2fb__entry__3"></td>
                     </tr>
                  </tbody></table>
         </div>
      </section>
      <section class="section" id="open-incidents-reports-dashboard__section_yfw_qk4_2fb"><h2 class="title sectiontitle">Interactive filters</h2>
         
         <div class="p">
            <ul class="ul" id="open-incidents-reports-dashboard__ul_ulw_dl4_2fb">
               <li class="li">Priority</li>
               <li class="li">Category</li>
               <li class="li">Assignment Group</li>
               <li class="li">State</li>
               <li class="li">Age</li>
            </ul>
         </div>
      </section>
      <section class="section" id="open-incidents-reports-dashboard__section_t5q_fl4_2fb"><h2 class="title sectiontitle">Data visualizations</h2>
         
         <div class="p">
            
            <table class="table frame-all" id="open-incidents-reports-dashboard__table_xvt_hl4_2fb"><caption></caption><colgroup><col style="width:33.33333333333333%"><col style="width:33.33333333333333%"><col style="width:33.33333333333333%"></colgroup><thead class="thead">
                     <tr class="row">
                        <th class="entry colsep-1 rowsep-1" id="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__1">Title</th>
                        <th class="entry colsep-1 rowsep-1" id="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__2">Type</th>
                        <th class="entry rowsep-1" id="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__3">Description</th>
                     </tr>
                  </thead><tbody class="tbody">
                     <tr class="row">
                        <td class="entry colsep-1 rowsep-1" headers="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__1">Open Incidents List</td>
                        <td class="entry colsep-1 rowsep-1" headers="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__2">List <p class="p"><span class="image icon"><a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/mpNom41vKLCZXX6L_2mr4w-MlbQAgTiiiMOLOw9T36wJg" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="mpNom41vKLCZXX6L_2mr4w-MlbQAgTiiiMOLOw9T36wJg"><img class="image icon ft-zoomable-image ft-responsive-image" id="open-incidents-reports-dashboard__image_imv_rz1_dlb" alt="list report icon" src="https://www.servicenow.com/docs/api/khub/maps/MlbQAgTiiiMOLOw9T36wJg/resources/mpNom41vKLCZXX6L_2mr4w-MlbQAgTiiiMOLOw9T36wJg/content?Ft-Calling-App=ft/turnkey-portal" data-ft-click-interceptor="ft-img-zoom" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="mpNom41vKLCZXX6L_2mr4w-MlbQAgTiiiMOLOw9T36wJg"></a></span></p></td>
                        <td class="entry rowsep-1" headers="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__3">List of all incident records for open incidents</td>
                     </tr>
                     <tr class="row">
                        <td class="entry colsep-1" headers="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__1">Open Incidents Pivot</td>
                        <td class="entry colsep-1" headers="open-incidents-reports-dashboard__table_xvt_hl4_2fb__entry__2">Pivot <p class="p"><span class="image icon"><a href="https://www.servicenow.com/docs/viewer/attachment/MlbQAgTiiiMOLOw9T36wJg/xi0f_xktkaqvfPd2E25nTQ-MlbQAgTiiiMOLOw9T36wJg" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="xi0f_xktkaqvfPd2E25nTQ-MlbQAgTiiiMOLOw9T36wJg"><img class="image icon ft-zoomable-image ft-responsive-image" id="open-incidents-reports-dashboard__image_ick_tz1_dlb" alt="pivot table report icon" src="https://www.servicenow.com/docs/api/khub/maps/MlbQAgTiiiMOLOw9T36wJg/resources/xi0f_xktkaqvfPd2E25nTQ-MlbQAgTiiiMOLOw9T36wJg/content?Ft-Calling-App=ft/turnkey-portal" data-ft-click-interceptor="ft-img-zoom" data-ft-container-id="MlbQAgTiiiMOLOw9T36wJg" data-ft-resource-id="xi0f_xktkaqvfPd2E25nTQ-MlbQAgTiiiMOLOw9T36wJg"></a></span></p></td>

