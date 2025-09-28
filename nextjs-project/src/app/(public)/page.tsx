// // Trang này đã được hợp nhất vào [locale]/page.tsx. Không còn sử dụng.
// export default function() { return null; }

// "use client";


// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { getOrderTrackingApi } from "../../server/order.api";
// import LanguageSwitcher from "../../components/LanguageSwitcher";

// const formatDate = (isoString: string) =>
//   isoString
//     ? new Date(isoString).toLocaleString("vi-VN", {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "";

// export default function PublicHome() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const [trackingCode, setTrackingCode] = useState("");
//   const [trackingResult, setTrackingResult] = useState<{
//     code: string;
//     status: string;
//     from: string;
//     to: string;
//     estimatedDelivery: string;
//   } | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   useEffect(() => {
//     // Chỉ chạy 1 lần khi mount
//     const token = localStorage.getItem("token");
//     setIsLoggedIn(!!token);

//     // Lấy params từ URL chỉ khi mount
//     const params = new URLSearchParams(window.location.search);
//     const urlToken = params.get("token");
//     const urlUser = params.get("user");
//     if (urlToken && urlUser) {
//       localStorage.setItem("token", urlToken);
//       localStorage.setItem("user", decodeURIComponent(urlUser));
//       setIsLoggedIn(true);
//       window.history.replaceState({}, document.title, "/");
//       router.push("/account");
//     }

//     const urlTrackingCode = params.get("trackingCode");
//     if (urlTrackingCode) setTrackingCode(urlTrackingCode);
//   }, [router]);

//   const handleTrackingSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!trackingCode.trim()) {
//       setTrackingResult(null);
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const res = await getOrderTrackingApi(trackingCode);
//       if (!res.ok) {
//         setTrackingResult(null);
//         alert("Không tìm thấy đơn hàng!");
//       } else {
//         const order = await res.json();
//         setTrackingResult({
//           code: order.orderId,
//           status: order.status || "Không xác định",
//           from: order.storeAddress || "",
//           to: order.address || "",
//           estimatedDelivery: order.estimatedDelivery || "",
//         });
//       }
//     } catch (error) {
//       console.error("Lỗi tra cứu đơn hàng:", error);
//       setTrackingResult(null);
//       alert("Đã xảy ra lỗi khi tra cứu đơn hàng!");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLogin = () => router.push("/login");
//   const handleDashboard = () => router.push("/account");
//   const handleCreateOrder = () =>
//     isLoggedIn ? router.push("/account/orders/new") : handleLogin();
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setIsLoggedIn(false);
//     setTrackingResult(null);
//   };

//   return (
//     <div className="flex flex-col min-h-screen w-full bg-gray-50">
//       {/* Language Switcher */}
//       <div className="fixed top-2 right-4 z-50">
//         <LanguageSwitcher />
//       </div>
//   {/* Header */}
//       <header className="fixed top-0 left-0 right-0 z-50 bg-green-700 shadow-md bg-opacity-90 backdrop-blur-md h-16 flex items-center px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center w-full">
//           <span className="ml-2 text-xl font-bold text-white">Fast Route</span>
//           <div className="flex items-center gap-4">
//             {isLoggedIn ? (
//               <>
//                 <button
//                   onClick={handleDashboard}
//                   className="text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-800 text-sm sm:text-base"
//                 >
//                   Tài khoản
//                 </button>
//                 <button
//                   onClick={handleCreateOrder}
//                   className="bg-white text-green-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-100 text-sm sm:text-base"
//                 >
//                   Tạo đơn hàng
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="border border-gray-300 text-green-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-50 text-sm sm:text-base"
//                 >
//                   Đăng xuất
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={handleCreateOrder}
//                   className="bg-white text-green-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-100 text-sm sm:text-base"
//                 >
//                   Tạo đơn hàng
//                 </button>
//                 <button
//                   onClick={handleLogin}
//                   className="border border-white text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-800 text-sm sm:text-base"
//                 >
//                   Đăng nhập
//                 </button>
//               </>
//             )}
//             {/* Language Switcher */}
//             <div className="ml-2">
//               <LanguageSwitcher />
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="flex-1 flex flex-col items-center justify-start mt-16 px-4 sm:px-6 lg:px-12 py-8 sm:py-12 bg-white">
//         {/* Hero */}
//         <div className="text-center mb-8 sm:mb-12 max-w-2xl">
//           <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 mb-4">
//             Dịch vụ giao hàng nhanh và đáng tin cậy
//           </h1>
//           <p className="text-base sm:text-lg lg:text-xl text-gray-700">
//             Tra cứu đơn hàng hoặc tạo đơn hàng mới ngay hôm nay
//           </p>
//         </div>

//         {/* Tracking */}
//         <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-12 border border-gray-200 w-full max-w-full sm:max-w-xl lg:max-w-3xl">
//           <h2 className="text-lg sm:text-2xl font-bold text-green-700 mb-6 text-center">
//             Tra cứu đơn hàng
//           </h2>
//           <form onSubmit={handleTrackingSubmit} className="space-y-4">
//             <div className="flex flex-col sm:flex-row gap-4">
//               <input
//                 type="text"
//                 value={trackingCode}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   setTrackingCode(val);
//                   if (!val.trim()) setTrackingResult(null);
//                 }}
//                 placeholder="Nhập mã vận đơn (ví dụ: FR001, FR002...)"
//                 className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 text-sm sm:text-base"
//               />
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 text-sm sm:text-base"
//               >
//                 {isLoading ? "Đang tìm..." : "Tra cứu"}
//               </button>
//             </div>
//           </form>

//           {trackingResult && (
//             <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-sm sm:text-base">
//               <h3 className="text-lg font-semibold text-green-800 mb-4">
//                 Thông tin đơn hàng: {trackingResult.code}
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Info label="Trạng thái" value={trackingResult.status} />
//                 <Info
//                   label="Dự kiến giao hàng"
//                   value={formatDate(trackingResult.estimatedDelivery)}
//                 />
//                 <Info label="Nơi gửi" value={trackingResult.from} />
//                 <Info label="Nơi nhận" value={trackingResult.to} />
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Features */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 w-full">
//           <Feature
//             icon="🚚"
//             title="Giao hàng nhanh"
//             text="Đảm bảo giao trong vòng 24 giờ"
//           />
//           <Feature
//             icon="📍"
//             title="Theo dõi thời gian thực"
//             text="Xem lộ trình đơn hàng trực tiếp trên bản đồ"
//           />
//           <Feature
//             icon="🔒"
//             title="An toàn & bảo mật"
//             text="Đảm bảo hàng hóa đến đúng người nhận"
//           />
//         </div>

//         {/* Call to Action */}
//         <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-6 sm:p-8 text-center text-white w-full">
//           <h2 className="text-2xl sm:text-3xl font-bold mb-4">
//             Bắt đầu giao hàng ngay hôm nay
//           </h2>
//           <p className="text-lg sm:text-xl mb-6">
//             Đăng ký để trải nghiệm dịch vụ tốt nhất
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={handleCreateOrder}
//               className="bg-white text-green-700 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-green-100 text-sm sm:text-base"
//             >
//               Tạo đơn ngay
//             </button>
//             <button
//               onClick={handleLogin}
//               className="border-2 border-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-green-800 text-sm sm:text-base"
//             >
//               Đăng nhập / Đăng ký
//             </button>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="bg-black/80 text-white py-12 mt-16 rounded-t-2xl backdrop-blur-md">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <FooterCol
//             title="Fast Route"
//             items={["Dịch vụ giao hàng nhanh và đáng tin cậy"]}
//             highlight
//           />
//           <FooterCol
//             title="Dịch vụ"
//             items={[
//               "Giao hàng nội thành",
//               "Giao hàng liên tỉnh",
//               "Giao hàng quốc tế",
//             ]}
//           />
//           <FooterCol
//             title="Hỗ trợ"
//             items={[
//               "Hotline: 1900-xxxx",
//               "Email: support@fastroute.com",
//               "Câu hỏi thường gặp",
//             ]}
//           />
//           <FooterCol
//             title="Theo dõi chúng tôi"
//             items={["Facebook", "Instagram", "LinkedIn"]}
//           />
//         </div>
//         <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-xs sm:text-sm">
//           &copy; 2025 Fast Route. Bảo lưu mọi quyền.
//         </div>
//       </footer>
//     </div>
//   );
// }

// /* --- Small reusable components --- */
// const Info = ({ label, value }: { label: string; value: string }) => (
//   <div>
//     <p className="text-xs sm:text-sm text-gray-700">{label}:</p>
//     <p className="font-semibold text-green-700">{value}</p>
//   </div>
// );

// const Feature = ({
//   icon,
//   title,
//   text,
// }: {
//   icon: string;
//   title: string;
//   text: string;
// }) => (
//   <div className="text-center p-6 bg-white rounded-xl shadow-lg">
//     <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl sm:text-2xl">
//       {icon}
//     </div>
//     <h3 className="text-lg sm:text-xl font-semibold mb-2 text-green-700">
//       {title}
//     </h3>
//     <p className="text-gray-700 text-sm sm:text-base">{text}</p>
//   </div>
// );

// const FooterCol = ({
//   title,
//   items,
//   highlight = false,
// }: {
//   title: string;
//   items: string[];
//   highlight?: boolean;
// }) => (
//   <div>
//     <h4
//       className={`font-semibold mb-4 ${
//         highlight ? "text-base sm:text-lg text-green-700" : "text-green-700"
//       }`}
//     >
//       {title}
//     </h4>
//     <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
//       {items.map((item, idx) => (
//         <li key={idx}>{item}</li>
//       ))}
//     </ul>
//   </div>
// );
