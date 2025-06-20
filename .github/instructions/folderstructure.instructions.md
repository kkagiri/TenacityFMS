---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.
All Response for CRQS and any CRUD and Queries in returning Errors or validation checkes must use [FMSResponse.cs](mdc:FMS.Application/Common/FMSResponse.cs)
always have validation check
FMS.Application/                // Core business logic, DTOs, commands, queries, and services for the FMS system . All services ,DTO,command and quieres are to located in feature of the module
FMS.webclient/                  // Likely contains the web client API for FMS (files not yet listed) all controllers are located here
FMS.frontend/                   // Modern frontend (React/JS), Redux, UI, and client-side logic (files not yet listed)
FMS.PTS.WindowsService/         // Windows service for PTS integration and background processing (files not yet listed)
FMS.Persistence/                // Data access, repositories, and persistence logic (files not yet listed)
FMS.Deployment/                 // Deployment scripts, configs, and automation for FMS (files not yet listed)
FMS.BackgroundServices/         // Background jobs, schedulers, and hosted services (files no

   if you use any class component uses Tailwind CSS add tw-
        <span className="tw-font-semibold">tw-</span> prefix to avoid conflicts
        with DevExtreme.
for font awersome icons start with "fa-light fa-icon"


use scss rather than css
if you have created the file - on applying the code if there is no content do not repeat the file eatino or deletetion , just continue with the excution of other files .

if you are in ask mode always indicate location of the file you intend to create ..
After finishing task expect for bugs write or update document in the documentation folder with feature if you have created a new file , update on process .if you create a new persistence that has to be saved in database entity fms.domain always make sure that its has a entity configuration file in fms .persistence and add it to gpsdatacontext , also create the myslq syntax but do not create the file holding the syntax


# Your rule content
all tailwind have tw- prefix
use fontawersome icon

use font awersome icon .
- You can @ files here
- You can use markdown but dont have to


in backend csharp project , if you dealing with return type check if FMSsponse.cs contain the correct response for your case
All PTSModel are in FMS.Domain.Entities project , dont create unless you are told to do so , in the onces that are there either improve based on documentation .

