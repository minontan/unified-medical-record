/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Appointments from './pages/Appointments';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import DiagnosticCentres from './pages/DiagnosticCentres';
import Doctors from './pages/Doctors';
import Friends from './pages/Friends';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import LabResults from './pages/LabResults';
import Landing from './pages/Landing';
import Measurements from './pages/Measurements';
import Medications from './pages/Medications';
import Pharmacies from './pages/Pharmacies';
import Profile from './pages/Profile';
import Summary from './pages/Summary';
import WomensHealth from './pages/WomensHealth';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Appointments": Appointments,
    "Community": Community,
    "Dashboard": Dashboard,
    "DiagnosticCentres": DiagnosticCentres,
    "Doctors": Doctors,
    "Friends": Friends,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "LabResults": LabResults,
    "Landing": Landing,
    "Measurements": Measurements,
    "Medications": Medications,
    "Pharmacies": Pharmacies,
    "Profile": Profile,
    "Summary": Summary,
    "WomensHealth": WomensHealth,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};