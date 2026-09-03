import { useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { UserRole } from "../models/consts.ts";
import {
    MdAssessment,
    MdDevices,
    MdLogout,
    MdPeople,
    MdPerson,
    MdMenu,
    MdClose
} from "react-icons/md";
// کامپوننت‌های خودت رو اینجا ایمپورت کن...
import ActiveDevicesView from "./devices/ActiveDevicesView.tsx";
import DeviceManagePage from "./devices/DeviceManagePage.tsx";
import UsersListView from "./user/UserListView.tsx";
import UsersRolesView from "./user/UserRolesView.tsx";
import LogsTable from "./report/DeviceLogsPage.tsx";
import DeviceMonitorPage from "./report/DeviceMonitorPage.tsx";
import DataAnalyzePage from "./report/DataAnalyzePage.tsx";
import { UserProfilePage } from "./profile/UserProfilePage.tsx";
import AiChatPage from "./report/AiChatPage.tsx";
import type { DeviceMonitorSelection } from "../models/device.ts";

const menuItems = [
    // ... دقیقاً همون منوهای خودت ...
    {
        label: "دستگاه ها",
        icon: <MdDevices className="text-xl"/>,
        roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.USER],
        children: [
            { label: "دستگاه های فعال", view: "devices-active", roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.USER] },
            { label: "مدیریت دستگاه ها", view: "devices-manage", roles: [UserRole.ADMIN, UserRole.INSTALLER] },
        ],
    },
    {
        label: "گزارشات",
        icon: <MdAssessment className="text-xl"/>,
        roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.REPORT, UserRole.USER],
        children: [
            { label: "لاگ ها", view: "logs", roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.REPORT, UserRole.USER] },
            { label: "مانیتور دستگاه", view: "monitor", roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.REPORT, UserRole.USER] },
            { label: "بررسی داده ها", view: "analyze", roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.REPORT, UserRole.USER] },
            { label: "تحلیل با هوش مصنوعی", view: "analyze-ai", roles: [UserRole.ADMIN] },
        ],
    },
    {
        label: "کاربران",
        icon: <MdPeople className="text-xl"/>,
        roles: [UserRole.ADMIN],
        children: [
            { label: "لیست کاربران", view: "users-list", roles: [UserRole.ADMIN] },
            { label: "نقش‌ها و دسترسی‌ها", view: "users-roles", roles: [UserRole.ADMIN] },
        ],
    },
    {
        label: "پروفایل",
        icon: <MdPerson className="text-xl"/>,
        roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.USER],
        view: "profile",
    }
]

export function Dashboard() {
    const [openMenu, setOpenMenu] = useState<number | null>(0)
    const [activeView, setActiveView] = useState<string>("devices-active")
    const [activeDevice, setActiveDevice] = useState<DeviceMonitorSelection | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // 👈 استیت جدید برای منوی موبایل
    const navigate = useNavigate()

    let userRole = UserRole.USER;
    const token = localStorage.getItem("token");

    if (token) {
        try {
            const decodedToken: any = jwtDecode(token);
            if (decodedToken.role) {
                userRole = decodedToken.role;
            }
        } catch (error) {
            console.error("داداش توکن مشکل داره یا باز نمیشه:", error);
        }
    }

    const filteredMenu = useMemo(() => {
        return menuItems
            .filter(item => item.roles.includes(userRole))
            .map(item => {
                if (item.children) {
                    return {
                        ...item,
                        children: item.children.filter(child => child.roles.includes(userRole))
                    };
                }
                return item;
            })
            .filter(item => (item.children && item.children.length > 0) || item.view);
    }, [userRole]);

    const viewToMenuIndex: Record<string, number> = {}
    filteredMenu.forEach((menu, index) => {
        if (menu.children) {
            menu.children.forEach((child) => {
                viewToMenuIndex[child.view] = index
            })
        } else if (menu.view) {
            viewToMenuIndex[menu.view] = index
        }
    })

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        navigate("/", { replace: true })
    }

    const toggleMenu = (index: number) => {
        setOpenMenu((prev) => (prev === index ? null : index))
    }

    const handleMenuClick = (view: string) => {
        setActiveView(view)
        setIsMobileMenuOpen(false) // 👈 بعد از انتخاب، منوی موبایل بسته بشه
    }

    useEffect(() => {
        const handler = (e: any) => {
            // رویدادهای قدیمی فقط IMEI می‌فرستادند؛ رویداد جدید نام و IMEI را با هم می‌فرستد.
            if (typeof e.detail === "string") {
                setActiveDevice({ deviceName: "", imei: e.detail })
            } else if (e.detail?.imei) {
                setActiveDevice({
                    deviceName: e.detail.deviceName || "",
                    imei: e.detail.imei
                })
            }
            setActiveView("monitor")
            setIsMobileMenuOpen(false)
        }

        window.addEventListener("monitor-device", handler)
        return () => window.removeEventListener("monitor-device", handler)
    }, [])

    useEffect(() => {
        const menuIndex = viewToMenuIndex[activeView]
        if (menuIndex !== undefined) {
            setOpenMenu(menuIndex)
        }
    }, [activeView, filteredMenu])

    function renderContent() {
        // ... (دقیقاً همون کد قبلی رندر محتوا)
        let currentViewConfig = null;
        for (const m of menuItems) {
            if (m.view === activeView) {
                currentViewConfig = m;
                break;
            }
            if (m.children) {
                const child = m.children.find(c => c.view === activeView);
                if (child) {
                    currentViewConfig = child;
                    break;
                }
            }
        }

        if (currentViewConfig && !currentViewConfig.roles.includes(userRole)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <span className="text-6xl mb-4">🚫</span>
                    <p className="text-lg">دسترسی غیرمجاز!</p>
                </div>
            );
        }

        switch (activeView) {
            case "devices-active": return <ActiveDevicesView />
            case "devices-manage": return <DeviceManagePage />
            case "users-list": return <UsersListView />
            case "users-roles": return <UsersRolesView />
            case "logs": return <LogsTable />
            case "monitor": return <DeviceMonitorPage initialDevice={activeDevice} />
            case "analyze": return <DataAnalyzePage/>
            case "analyze-ai": return <AiChatPage/>
            case "profile": return <UserProfilePage/>
            default:
                return (
                    <div className="flex items-center justify-center h-full p-4">
                        <p className="text-lg text-gray-500">این بخش هنوز آماده نشده. 🚧</p>
                    </div>
                )
        }
    }

    return (
        <div dir="rtl" className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">

            {/* هدر مخصوص موبایل (فقط تو صفحات کوچیک نشون داده میشه) */}
            <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-20">
                <h2 className="text-xl font-bold text-gray-800">داشبورد</h2>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <MdMenu className="text-2xl" />
                </button>
            </header>

            {/* بک‌گراند تاریک پشت منو تو حالت موبایل */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* سایدبار */}
            <aside className={`
                fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 shadow-sm flex flex-col
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">داشبورد</h2>
                    <div className="flex items-center gap-2">
                        {/* دکمه بستن منو در موبایل */}
                        <button
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <MdClose className="text-xl" />
                        </button>
                        <button
                            onClick={handleLogout}
                            title="خروج از حساب"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 rounded-full transition-colors flex items-center justify-center"
                        >
                            <MdLogout className="text-xl"/>
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredMenu.map((item, index) => {
                        if (!item.children || item.children.length === 0) {
                            const isActive = activeView === item.view
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        if(item.view) handleMenuClick(item.view)
                                        setOpenMenu(null)
                                    }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                        isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            )
                        }

                        const isOpen = openMenu === index
                        return (
                            <div key={item.label}>
                                <button
                                    onClick={() => toggleMenu(index)}
                                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                                >
                                    <span className="flex items-center gap-2 font-medium">
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </span>
                                    <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                                        ▾
                                    </span>
                                </button>

                                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                                    <div className="mt-1 mr-4 pr-3 border-r border-gray-200 space-y-1">
                                        {item.children.map((child) => {
                                            const isActive = activeView === child.view
                                            return (
                                                <button
                                                    key={child.label}
                                                    onClick={() => handleMenuClick(child.view)}
                                                    className={`block w-full text-right px-3 py-2 rounded-lg text-sm transition ${
                                                        isActive
                                                            ? "bg-blue-50 text-blue-600 font-medium"
                                                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                                                    }`}
                                                >
                                                    {child.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </nav>
            </aside>

            {/* بخش محتوای اصلی */}
            <main className="flex-1 p-4 sm:p-8 overflow-auto h-[calc(100vh-64px)] md:h-screen">
                {renderContent()}
            </main>
        </div>
    )
}
