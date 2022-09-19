import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'MENUITEMS.MENU.TEXT',
        isTitle: true
    },
    {
        id: 2,
        label: 'MENUITEMS.DASHBOARDS.TEXT',
        icon: 'bx-home-circle',
        badge: {
            variant: 'info',
            text: 'MENUITEMS.DASHBOARDS.BADGE',
        },
        subItems: [
            {
                id: 3,
                label: 'MENUITEMS.DASHBOARDS.LIST.DEFAULT',
                link: '/',
                parentId: 2
            },
            {
                id: 4,
                label: 'MENUITEMS.DASHBOARDS.LIST.SAAS',
                link: '/',
                parentId: 2
            },
            {
                id: 6,
                label: 'MENUITEMS.DASHBOARDS.LIST.BLOG',
                link: '/',
                parentId: 2
            },
        ]
    },
    {
        id: 56,
        label: 'MENUITEMS.PAGES.TEXT',
        isTitle: true
    },
    {
        id: 57,
        label: 'MENUITEMS.AUTHENTICATION.TEXT',
        icon: 'bx-user-circle',
        badge: {
            variant: 'success',
            text: 'MENUITEMS.AUTHENTICATION.BADGE',
        },
        subItems: [
            {
                id: 58,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN',
                link: '/account/login',
                parentId: 57
            },
            {
                id: 59,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN2',
                link: '/account/login-2',
                parentId: 57
            },
            {
                id: 60,
                label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER',
                link: '/account/signup',
                parentId: 57
            },
            {
                id: 61,
                label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER2',
                link: '/account/signup-2',
                parentId: 57
            },
            {
                id: 62,
                label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD',
                link: '/account/reset-password',
                parentId: 57
            },
            {
                id: 63,
                label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD2',
                link: '/account/recoverpwd-2',
                parentId: 57
            },
            {
                id: 64,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN',
                link: '/pages/lock-screen-1',
                parentId: 57
            },
            {
                id: 65,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN2',
                link: '/pages/lock-screen-2',
                parentId: 57
            },
            {
                id: 66,
                label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL',
                link: '/pages/confirm-mail',
                parentId: 57
            },
            {
                id: 67,
                label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL2',
                link: '/pages/confirm-mail-2',
                parentId: 57
            },
            {
                id: 68,
                label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION',
                link: '/pages/email-verification',
                parentId: 57
            },
            {
                id: 69,
                label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION2',
                link: '/pages/email-verification-2',
                parentId: 57
            },
            {
                id: 70,
                label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION',
                link: '/pages/two-step-verification',
                parentId: 57
            },
            {
                id: 71,
                label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION2',
                link: '/pages/two-step-verification-2',
                parentId: 57
            }
        ]
    },
    {
        id: 72,
        label: 'MENUITEMS.UTILITY.TEXT',
        icon: 'bx-file',
        subItems: [
            {
                id: 73,
                label: 'MENUITEMS.UTILITY.LIST.STARTER',
                link: '/',
                parentId: 72
            },
            {
                id: 74,
                label: 'MENUITEMS.UTILITY.LIST.MAINTENANCE',
                link: '/',
                parentId: 72
            },
            {
                id: 74,
                label: 'Coming Soon',
                link: '/',
                parentId: 72
            },
            {
                id: 75,
                label: 'MENUITEMS.UTILITY.LIST.TIMELINE',
                link: '/',
                parentId: 72
            },
            {
                id: 76,
                label: 'MENUITEMS.UTILITY.LIST.FAQS',
                link: '/',
                parentId: 72
            },
            {
                id: 77,
                label: 'MENUITEMS.UTILITY.LIST.PRICING',
                link: '/',
                parentId: 72
            },
            {
                id: 78,
                label: 'MENUITEMS.UTILITY.LIST.ERROR404',
                link: '/',
                parentId: 72
            },
            {
                id: 79,
                label: 'MENUITEMS.UTILITY.LIST.ERROR500',
                link: '/',
                parentId: 72
            },
        ]
    },
    {
        id: 80,
        label: 'MENUITEMS.COMPONENTS.TEXT',
        isTitle: true
    },
    {
        id: 100,
        label: 'MENUITEMS.FORMS.TEXT',
        icon: 'bxs-eraser',
        subItems: [
           
            {
                id: 102,
                label: 'MENUITEMS.FORMS.LIST.LAYOUTS',
                link: '/form/layouts',
                parentId: 100
            },

            {
                id: 103,
                label: 'MENUITEMS.FORMS.LIST.FORMARRAY',
                link: '/form/formarray',
                parentId: 100
            },
           
        ]
    },
    {
        id: 109,
        icon: 'bx-list-ul',
        label: 'MENUITEMS.TABLES.TEXT',
        subItems: [
            {
                id: 110,
                label: 'MENUITEMS.TABLES.LIST.BASIC',
                link: '/',
                parentId: 109
            }
        ]
    },
    {
        id: 112,
        icon: 'bxs-bar-chart-alt-2',
        label: 'MENUITEMS.CHARTS.TEXT',
        subItems: [
            {
                id: 113,
                label: 'MENUITEMS.CHARTS.LIST.APEX',
                link: '/',
                parentId: 112
            },
            {
                id: 114,
                label: 'MENUITEMS.CHARTS.LIST.CHARTJS',
                link: '/',
                parentId: 112
            },
            {
                id: 115,
                label: 'MENUITEMS.CHARTS.LIST.CHARTIST',
                link: '/',
                parentId: 112
            },
            {
                id: 116,
                label: 'MENUITEMS.CHARTS.LIST.ECHART',
                link: '/',
                parentId: 112
            }
        ]
    },
    {
        id: 122,
        label: 'MENUITEMS.MAPS.TEXT',
        icon: 'bx-map',
        subItems: [
            {
                id: 123,
                label: 'MENUITEMS.MAPS.LIST.LEAFLETMAP',
                link: '/maps/leaflet',
                parentId: 122
            }
        ]
    },
];

