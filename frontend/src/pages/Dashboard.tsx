import { useNavigate } from "react-router-dom"
import DeviceManagePage from "./DeviceManagePage.tsx";
import LogsTable from "./DeviceLogsPage.tsx";
import UsersListView from "./UserListView.tsx";
import UsersRolesView from "./UserRolesView.tsx";
import DeviceMonitorPage from "./DeviceMonitorPage.tsx";
import { useEffect, useState, useMemo } from "react";
import ActiveDevicesView from "./ActiveDevicesView.tsx";
import DataAnalyzePage from "./DataAnalyzePage.tsx";
import {jwtDecode} from "jwt-decode";
import {UserRole} from "../models/consts.ts";
import {MdAssessment, MdDevices, MdLogout, MdPeople, MdPerson} from "react-icons/md";
import {UserProfilePage} from "./UserProfilePage.tsx";

const menuItems = [
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
        label: "کاربران",
        icon: <MdPeople className="text-xl"/>,
        roles: [UserRole.ADMIN],
        children: [
            { label: "لیست کاربران", view: "users-list", roles: [UserRole.ADMIN] },
            { label: "نقش‌ها و دسترسی‌ها", view: "users-roles", roles: [UserRole.ADMIN] },
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
        label: "پروفایل",
        icon: <MdPerson className="text-xl"/>,
        roles: [UserRole.ADMIN, UserRole.INSTALLER, UserRole.USER],
        view: "profile", // به جای فرزند داشتن، خودش یه view مستقیم داره
    }
]

export function Dashboard() {
    const [openMenu, setOpenMenu] = useState<number | null>(0)
    const [activeView, setActiveView] = useState<string>("devices-active")
    const [activeDeviceImei, setActiveDeviceImei] = useState<string | null>(null)
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

    // فیلتر منوها با قابلیت پشتیبانی از منوهای بدون فرزند
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

    // آپدیت کردن ایندکس‌ها با توجه به منوهای بدون فرزند
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

    useEffect(() => {
        const handler = (e: any) => {
            setActiveDeviceImei(e.detail)
            setActiveView("monitor")
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
        // پیدا کردن کانفیگ ویو فعلی (چه فرزند باشه چه منوی اصلی)
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
            case "monitor": return <DeviceMonitorPage initialImei={activeDeviceImei} />
            case "analyze": return <DataAnalyzePage/>
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
        <div dir="rtl" className="flex min-h-screen bg-gray-50">
            <aside className="w-64 shrink-0 bg-white border-l border-gray-200 shadow-sm flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">داشبورد</h2>
                    <button
                        onClick={handleLogout}
                        title="خروج از حساب"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 rounded-full transition-colors flex items-center justify-center"
                    >
                        <MdLogout className="text-xl"/>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredMenu.map((item, index) => {
                        // اگه منو فرزند نداره (مثل پروفایل)، مستقیما به عنوان دکمه رندرش کن
                        if (!item.children || item.children.length === 0) {
                            const isActive = activeView === item.view
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        if(item.view) setActiveView(item.view)
                                        setOpenMenu(null) // بقیه منوها بسته بشن
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

                        // برای منوهایی که فرزند دارن:
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
                                                    onClick={() => setActiveView(child.view)}
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

            <main className="flex-1 p-4 sm:p-8 overflow-auto">
                {renderContent()}
            </main>
        </div>
    )
}