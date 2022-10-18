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
                label: 'MENUITEMS.CHARTS.LIST.AMCHART',
                link: '/linechart',
                parentId: 112
            },
            {
                id: 114,
                label: 'MENUITEMS.CHARTS.LIST.CHARTJS',
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

