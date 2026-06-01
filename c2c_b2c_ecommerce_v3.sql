-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2026 at 12:04 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `c2c_b2c_ecommerce`
--

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('pending','resolved','rejected') DEFAULT 'pending',
  `resolution` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disputes`
--

INSERT INTO `disputes` (`id`, `order_id`, `user_id`, `reason`, `status`, `resolution`, `created_at`) VALUES
(1, 3, 2, 'ko muốn mua hàng nữa', 'resolved', 'tụi tui đã đàm phán bên kia nên chúng tui sẽ hoàn trả lại', '2026-06-01 09:50:26');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `created_at`) VALUES
(1, 2, 3, 'cho hỏi bên em còn hàng  cũ d=samsung ko', '2026-06-01 19:09:48'),
(2, 2, 4, 'bên bạn còn sản phẩm h ko', '2026-06-01 19:10:28'),
(3, 3, 2, 'có vẫn còn đơn hàng', '2026-06-01 19:12:09'),
(4, 5, 9, 'Sản phẩm còn bảo hành bao lâu thế ạ?', '2026-06-01 21:49:27');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `shipping_address` varchar(255) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'COD',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `shipping_partner` varchar(50) DEFAULT 'GHN',
  `shipping_fee` decimal(10,2) DEFAULT 0.00,
  `voucher_code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `buyer_id`, `total_amount`, `status`, `shipping_address`, `payment_method`, `created_at`, `shipping_partner`, `shipping_fee`, `voucher_code`) VALUES
(2, 2, 16500000.00, 'delivered', 'Nguyễn Văn Mua - 567000998 - 234 sg 45', 'COD', '2026-06-01 08:46:26', 'GHN', 0.00, NULL),
(3, 2, 7800000.00, 'cancelled', 'Nguyễn Văn Mua - 897766551 - 2564 sk34 ql8', 'COD', '2026-06-01 08:59:01', 'GHN', 0.00, NULL),
(4, 2, 29490000.00, 'pending', 'Nguyễn Văn Mua - 556677889 - 356 ql13', 'COD', '2026-06-01 09:04:05', 'GHN', 0.00, NULL),
(5, 2, 5600000.00, 'delivered', 'Nguyễn Văn Mua - 879555553 - 45fg 34ql90', 'Wallet', '2026-06-01 18:28:18', 'GHN', 30000.00, 'GIAM30KZ'),
(6, 2, 16480000.00, 'delivered', 'Nguyễn Văn Mua - 755599908 - 23466889', 'Wallet', '2026-06-01 19:04:21', 'GHN', 30000.00, 'GIAM50K');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `price`, `quantity`, `created_at`) VALUES
(2, 2, 7, 16500000.00, 1, '2026-06-01 08:46:27'),
(3, 3, 8, 7800000.00, 1, '2026-06-01 08:59:01'),
(4, 4, 3, 29490000.00, 1, '2026-06-01 09:04:05'),
(5, 5, 5, 5600000.00, 1, '2026-06-01 18:28:18'),
(6, 6, 7, 16500000.00, 1, '2026-06-01 19:04:21');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `is_mall` tinyint(1) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_sponsored` tinyint(1) DEFAULT 0,
  `international_shipping` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `shop_id`, `name`, `description`, `price`, `stock`, `sku`, `is_mall`, `image_url`, `created_at`, `is_sponsored`, `international_shipping`) VALUES
(1, 1, 'Điện thoại iPhone 11 64GB Cũ', 'Máy cũ qua sử dụng còn đẹp 95%, pin 82%. Bản quốc tế, mọi chức năng hoạt động hoàn hảo. Phụ kiện đi kèm gồm cáp sạc.', 5200000.00, 2, 'IP11-64G-USED', 0, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60', '2026-05-30 07:28:20', 0, 0),
(2, 1, 'Tai nghe Sony WH-1000XM4 Like New', 'Tai nghe chụp tai Sony XM4 chống ồn chủ động đỉnh cao, mới 99% không vết trầy xước. Pin nghe liên tục 30 tiếng, chất âm đỉnh cao.', 4200000.00, 1, 'SONY-XM4-USED', 0, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', '2026-05-30 07:28:20', 0, 0),
(3, 2, 'iPhone 15 Pro Max 256GB Chính Hãng VN/A', 'Điện thoại thông minh cao cấp thế hệ mới nhất của Apple với khung viền Titanium siêu bền nhẹ, nút Action mới và hệ thống camera zoom quang học 5x đẳng cấp.', 29490000.00, 14, 'IP15PM-256G', 1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60', '2026-05-30 07:28:20', 0, 0),
(4, 2, 'MacBook Air 13-inch M2 (8GB RAM / 256GB SSD)', 'Mẫu máy tính xách tay siêu mỏng nhẹ trang bị chip Apple M2 mạnh mẽ, màn hình Liquid Retina sắc nét và thời lượng pin lên đến 18 giờ liên tục.', 24890000.00, 10, 'MBAIR-M2-256G', 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60', '2026-05-30 07:28:20', 0, 0),
(5, 1, 'Samsung M14', '### Giới thiệu sản phẩm: **Samsung M14**\n\nChào mừng bạn đến với sản phẩm **Samsung M14** - sự lựa chọn hoàn hảo mang lại trải nghiệm tuyệt vời cho cuộc sống hiện đại. Được sản xuất dựa trên công nghệ tiên tiến và quy trình kiểm duyệt chất lượng nghiêm ngặt, sản phẩm tự hào đem lại giá trị vượt trội và độ bền cao cho khách hàng.\n\n---\n\n### 🌟 Các Điểm Nổi Bật của Sản Phẩm\n\n- **Thiết kế tối giản & hiện đại:** Phù hợp với mọi không gian và phong cách sống của bạn.\n- **Chất liệu cao cấp:** Đảm bảo độ bền bỉ, an toàn tuyệt đối khi sử dụng lâu dài.\n- **Hiệu năng xuất sắc:** Tối ưu hóa tính năng sử dụng, giải quyết triệt để nhu cầu của người dùng.\n- **Thân thiện với môi trường:** Quy trình sản xuất xanh, giảm thiểu rác thải.\n\n---\n\n### 🛠️ Thông Số Kỹ Thuật Chi Tiết\n\n- **Tên sản phẩm:** Samsung M14\n- **Danh mục:** Điện thoại & Tablet\n- **Công nghệ tích hợp:** Tiêu chuẩn Quốc Tế ISO-9001\n- **Xuất xứ:** Hàng chính hãng phân phối toàn quốc\n- **Tình trạng:** Mới 100% nguyên hộp kèm bảo hành\n\n---\n\n### 📖 Hướng Dẫn Sử Dụng & Bảo Quản\n\n1. **Sử dụng:** Đọc kỹ hướng dẫn sử dụng kèm theo trong hộp sản phẩm trước khi khởi động.\n2. **Bảo quản:** Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ quá cao.\n3. **Vệ sinh:** Lau nhẹ bằng khăn mềm khô sau khi sử dụng để giữ độ mới của sản phẩm.\n\n---\n\n### 🛡️ Chính Sách Bảo Hành & Cam Kết\n\n- **Cam kết:** Sản phẩm y hình, giống mô tả 100%.\n- **Bảo hành:** Đổi trả miễn phí trong vòng 7 ngày đầu nếu có lỗi kỹ thuật từ nhà sản xuất.\n- **Đóng gói:** Sản phẩm được bọc bong bóng chống sốc cẩn thận khi vận chuyển.\n- **Cập nhật ngày:** 1/6/2026 (Phiên bản SEO bởi AI Trợ lý Bán hàng)', 5600000.00, 9, 'SM15A-M14', 0, 'http://localhost:5002/uploads/1780295729945-557185422.jpg', '2026-06-01 06:35:40', 0, 1),
(7, 2, 'Samsung-ZFold5', '### Giới thiệu sản phẩm: **Samsung-ZFold5**\n\nChào mừng bạn đến với sản phẩm **Samsung-ZFold5** - sự lựa chọn hoàn hảo mang lại trải nghiệm tuyệt vời cho cuộc sống hiện đại. Được sản xuất dựa trên công nghệ tiên tiến và quy trình kiểm duyệt chất lượng nghiêm ngặt, sản phẩm tự hào đem lại giá trị vượt trội và độ bền cao cho khách hàng.\n\n---\n\n### 🌟 Các Điểm Nổi Bật của Sản Phẩm\n\n- **Thiết kế tối giản & hiện đại:** Phù hợp với mọi không gian và phong cách sống của bạn.\n- **Chất liệu cao cấp:** Đảm bảo độ bền bỉ, an toàn tuyệt đối khi sử dụng lâu dài.\n- **Hiệu năng xuất sắc:** Tối ưu hóa tính năng sử dụng, giải quyết triệt để nhu cầu của người dùng.\n- **Thân thiện với môi trường:** Quy trình sản xuất xanh, giảm thiểu rác thải.\n\n---\n\n### 🛠️ Thông Số Kỹ Thuật Chi Tiết\n\n- **Tên sản phẩm:** Samsung-ZFold5\n- **Danh mục:** Điện thoại & Tablet\n- **Công nghệ tích hợp:** Tiêu chuẩn Quốc Tế ISO-9001\n- **Xuất xứ:** Hàng chính hãng phân phối toàn quốc\n- **Tình trạng:** Mới 100% nguyên hộp kèm bảo hành\n\n---\n\n### 📖 Hướng Dẫn Sử Dụng & Bảo Quản\n\n1. **Sử dụng:** Đọc kỹ hướng dẫn sử dụng kèm theo trong hộp sản phẩm trước khi khởi động.\n2. **Bảo quản:** Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ quá cao.\n3. **Vệ sinh:** Lau nhẹ bằng khăn mềm khô sau khi sử dụng để giữ độ mới của sản phẩm.\n\n---\n\n### 🛡️ Chính Sách Bảo Hành & Cam Kết\n\n- **Cam kết:** Sản phẩm y hình, giống mô tả 100%.\n- **Bảo hành:** Đổi trả miễn phí trong vòng 7 ngày đầu nếu có lỗi kỹ thuật từ nhà sản xuất.\n- **Đóng gói:** Sản phẩm được bọc bong bóng chống sốc cẩn thận khi vận chuyển.\n- **Cập nhật ngày:** 1/6/2026 (Phiên bản SEO bởi AI Trợ lý Bán hàng)', 16500000.00, 8, 'SM78-ZF5', 1, 'http://localhost:5002/uploads/1780296084956-49880426.jpg', '2026-06-01 06:42:13', 1, 0),
(8, 2, 'sk', '### Giới thiệu sản phẩm: **sk**\n\nChào mừng bạn đến với sản phẩm **sk** - sự lựa chọn hoàn hảo mang lại trải nghiệm tuyệt vời cho cuộc sống hiện đại. Được sản xuất dựa trên công nghệ tiên tiến và quy trình kiểm duyệt chất lượng nghiêm ngặt, sản phẩm tự hào đem lại giá trị vượt trội và độ bền cao cho khách hàng.\n\n---\n\n### 🌟 Các Điểm Nổi Bật của Sản Phẩm\n\n- **Thiết kế tối giản & hiện đại:** Phù hợp với mọi không gian và phong cách sống của bạn.\n- **Chất liệu cao cấp:** Đảm bảo độ bền bỉ, an toàn tuyệt đối khi sử dụng lâu dài.\n- **Hiệu năng xuất sắc:** Tối ưu hóa tính năng sử dụng, giải quyết triệt để nhu cầu của người dùng.\n- **Thân thiện với môi trường:** Quy trình sản xuất xanh, giảm thiểu rác thải.\n\n---\n\n### 🛠️ Thông Số Kỹ Thuật Chi Tiết\n\n- **Tên sản phẩm:** sk\n- **Danh mục:** Điện thoại & Tablet\n- **Công nghệ tích hợp:** Tiêu chuẩn Quốc Tế ISO-9001\n- **Xuất xứ:** Hàng chính hãng phân phối toàn quốc\n- **Tình trạng:** Mới 100% nguyên hộp kèm bảo hành\n\n---\n\n### 📖 Hướng Dẫn Sử Dụng & Bảo Quản\n\n1. **Sử dụng:** Đọc kỹ hướng dẫn sử dụng kèm theo trong hộp sản phẩm trước khi khởi động.\n2. **Bảo quản:** Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ quá cao.\n3. **Vệ sinh:** Lau nhẹ bằng khăn mềm khô sau khi sử dụng để giữ độ mới của sản phẩm.\n\n---\n\n### 🛡️ Chính Sách Bảo Hành & Cam Kết\n\n- **Cam kết:** Sản phẩm y hình, giống mô tả 100%.\n- **Bảo hành:** Đổi trả miễn phí trong vòng 7 ngày đầu nếu có lỗi kỹ thuật từ nhà sản xuất.\n- **Đóng gói:** Sản phẩm được bọc bong bóng chống sốc cẩn thận khi vận chuyển.\n- **Cập nhật ngày:** 1/6/2026 (Phiên bản SEO bởi AI Trợ lý Bán hàng)', 7800000.00, 1, 'dj-90', 1, 'http://localhost:5002/uploads/1780297157200-551950223.jpg', '2026-06-01 06:59:24', 0, 1),
(9, 1, 'Samsung-A55', '### Giới thiệu sản phẩm: **Samsung-A55**\n\nChào mừng bạn đến với sản phẩm **Samsung-A55** - sự lựa chọn hoàn hảo mang lại trải nghiệm tuyệt vời cho cuộc sống hiện đại. Được sản xuất dựa trên công nghệ tiên tiến và quy trình kiểm duyệt chất lượng nghiêm ngặt, sản phẩm tự hào đem lại giá trị vượt trội và độ bền cao cho khách hàng.\n\n---\n\n### 🌟 Các Điểm Nổi Bật của Sản Phẩm\n\n- **Thiết kế tối giản & hiện đại:** Phù hợp với mọi không gian và phong cách sống của bạn.\n- **Chất liệu cao cấp:** Đảm bảo độ bền bỉ, an toàn tuyệt đối khi sử dụng lâu dài.\n- **Hiệu năng xuất sắc:** Tối ưu hóa tính năng sử dụng, giải quyết triệt để nhu cầu của người dùng.\n- **Thân thiện với môi trường:** Quy trình sản xuất xanh, giảm thiểu rác thải.\n\n---\n\n### 🛠️ Thông Số Kỹ Thuật Chi Tiết\n\n- **Tên sản phẩm:** Samsung-A55\n- **Danh mục:** Điện thoại & Tablet\n- **Công nghệ tích hợp:** Tiêu chuẩn Quốc Tế ISO-9001\n- **Xuất xứ:** Hàng chính hãng phân phối toàn quốc\n- **Tình trạng:** Mới 100% nguyên hộp kèm bảo hành\n\n---\n\n### 📖 Hướng Dẫn Sử Dụng & Bảo Quản\n\n1. **Sử dụng:** Đọc kỹ hướng dẫn sử dụng kèm theo trong hộp sản phẩm trước khi khởi động.\n2. **Bảo quản:** Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ quá cao.\n3. **Vệ sinh:** Lau nhẹ bằng khăn mềm khô sau khi sử dụng để giữ độ mới của sản phẩm.\n\n---\n\n### 🛡️ Chính Sách Bảo Hành & Cam Kết\n\n- **Cam kết:** Sản phẩm y hình, giống mô tả 100%.\n- **Bảo hành:** Đổi trả miễn phí trong vòng 7 ngày đầu nếu có lỗi kỹ thuật từ nhà sản xuất.\n- **Đóng gói:** Sản phẩm được bọc bong bóng chống sốc cẩn thận khi vận chuyển.\n- **Cập nhật ngày:** 2/6/2026 (Phiên bản SEO bởi AI Trợ lý Bán hàng)', 8570000.00, 8, '35SM-67FH', 0, 'http://localhost:5002/uploads/1780349854418-896136467.jpg', '2026-06-01 21:38:50', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `shops`
--

CREATE TABLE `shops` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `shop_name` varchar(255) NOT NULL,
  `shop_type` enum('individual','business') DEFAULT 'individual',
  `address` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `tax_code` varchar(100) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `banner_url` varchar(500) DEFAULT NULL,
  `reject_reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shops`
--

INSERT INTO `shops` (`id`, `user_id`, `shop_name`, `shop_type`, `address`, `phone`, `tax_code`, `is_approved`, `created_at`, `banner_url`, `reject_reason`) VALUES
(1, 3, 'Cửa Hàng Đồ Cũ Tèo', 'individual', '123 Đường Láng, Đống Đa, Hà Nội', '0912345678', NULL, 1, '2026-05-30 07:28:20', NULL, NULL),
(2, 4, 'Apple Authorized Reseller VN', 'business', '456 Lê Lợi, Quận 1, TP. HCM', '19001508', '0102030405', 1, '2026-05-30 07:28:20', NULL, NULL),
(3, 5, 'Shop SVfe', 'individual', 'số 12 ql7 tbhg', '09863357', NULL, 0, '2026-06-01 19:59:28', NULL, NULL),
(4, 8, 'test 456', 'individual', 'scf 56 gh7', '1155667788', NULL, 0, '2026-06-01 21:03:44', NULL, NULL),
(5, 9, 'Kien Shop Test', 'individual', '123 Test St, Hanoi', '0987654321', NULL, 0, '2026-06-01 21:23:35', NULL, NULL),
(7, 10, 'Kien Shop Test 2', 'individual', '123 Test St, Hanoi', '0987654321', NULL, 0, '2026-06-01 21:26:10', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('escrow','holding','released','refunded') DEFAULT 'holding',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `order_id`, `amount`, `status`, `created_at`) VALUES
(2, 2, 16500000.00, 'released', '2026-06-01 08:46:27'),
(3, 3, 7800000.00, 'refunded', '2026-06-01 08:59:01'),
(4, 4, 29490000.00, 'released', '2026-06-01 09:04:05'),
(5, 5, 5600000.00, 'released', '2026-06-01 18:28:18'),
(6, 6, 16480000.00, 'released', '2026-06-01 19:04:21');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('buyer','c2c_seller','b2c_seller','admin') DEFAULT 'buyer',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `created_at`) VALUES
(1, 'Admin Hệ Thống', 'admin@test.com', '$2a$10$6Tv0TbA6ZS8wfQ8PeBcYee36QUl/Qto19453tM8QqbT3fOrRxvkqC', 'admin', 'active', '2026-05-30 07:28:20'),
(2, 'Nguyễn Văn Mua', 'buyer@test.com', '$2a$10$DLa7514QtBKNoKvzgjsy0eAo8i1JsLJYb.xkxXmnRZ.lvMBplFhju', 'buyer', 'active', '2026-05-30 07:28:20'),
(3, 'Trần Văn Bán C2C', 'seller_c2c@test.com', '$2a$10$AmL7YX9TD0bZ30UE0v0NiOclXZrjQVF9qO0qWyU.37uNjgaagz93a', 'c2c_seller', 'active', '2026-05-30 07:28:20'),
(4, 'Doanh Nghiệp B2C', 'business_b2c@test.com', '$2a$10$yYFHlB0USjYksNnmrXeEy.5nc57c69ubQJ4rZ7bkXkJepM3U67UqG', 'b2c_seller', 'active', '2026-05-30 07:28:20'),
(5, 'đào trung kien', 'kevinkien2500@gmail.com', '$2a$10$xQRSMymyZ/TXqCm5DRv.jOXNxFENRnblYUPU2dreKSZK6HYkWLApq', 'buyer', 'active', '2026-05-31 05:44:37'),
(6, 'Test User', 'test_1780344854815@example.com', '$2a$10$ZB4ZoxIGpuQnRkiiMwfHSedDp7t/cLqEfhTU6yTYhCUrCbe0Jbqla', 'buyer', 'active', '2026-06-01 20:14:15'),
(7, 'Test User', 'test_1780344935288@example.com', '$2a$10$YzynZJVqyQsAisIiT8LaLO7x0tABLt3Bgc.hlm6C8AqCA9YbI.LNm', 'buyer', 'active', '2026-06-01 20:15:35'),
(8, 'tfe', 'tfe@gmail.com', '$2a$10$exQxMfDJglJmuIUvN0KJC.yRSDyKT5uXb/WC.HYYppCEPX75JswfO', 'buyer', 'active', '2026-06-01 21:02:52'),
(9, 'Dao Trung Kien', 'buyer_1780348971446@example.com', '$2a$10$FCUWvGmmbglObd31lbzV8.iMHPLs40mrqCo7OGHR7Whr4Crwru5oq', 'buyer', 'active', '2026-06-01 21:23:20'),
(10, 'Dao Trung Kien', 'buyer_1780349168922@example.com', '$2a$10$sBP/thG.QhQ3BaAOKTA0Q.sogp80SPPQeNJ.I5WCpSTVB8k63Czgm', 'buyer', 'active', '2026-06-01 21:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address_detail` varchar(255) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`id`, `user_id`, `balance`, `created_at`) VALUES
(1, 2, 45740000.00, '2026-06-01 09:52:26'),
(2, 4, 66480000.00, '2026-06-01 10:48:28'),
(3, 3, 55600000.00, '2026-06-01 18:24:39'),
(4, 5, 400000.00, '2026-06-01 19:59:34'),
(5, 6, 0.00, '2026-06-01 20:14:16'),
(6, 7, 0.00, '2026-06-01 20:15:36'),
(7, 8, 0.00, '2026-06-01 21:02:52'),
(8, 9, 0.00, '2026-06-01 21:23:20'),
(9, 10, 0.00, '2026-06-01 21:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` int(11) NOT NULL,
  `wallet_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('deposit','withdraw','payment','refund','receive') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`id`, `wallet_id`, `amount`, `type`, `description`, `created_at`) VALUES
(1, 1, 7800000.00, 'refund', 'Hoàn tiền tranh chấp đơn hàng #3 theo quyết định Admin', '2026-06-01 09:52:26'),
(2, 1, 50000.00, 'deposit', 'Nạp tiền vào ví điện tử', '2026-06-01 09:53:00'),
(3, 1, 10000000.00, 'deposit', 'Nạp tiền vào ví điện tử', '2026-06-01 18:23:08'),
(4, 1, 5630000.00, 'payment', 'Thanh toán đơn hàng mua sắm', '2026-06-01 18:28:18'),
(5, 3, 5600000.00, 'receive', 'Nhận tiền thanh toán đơn hàng #5 (Ví giải ngân)', '2026-06-01 18:59:51'),
(6, 1, 50000000.00, 'deposit', 'Nạp tiền vào ví điện tử', '2026-06-01 19:00:29'),
(7, 1, 16480000.00, 'payment', 'Thanh toán đơn hàng mua sắm', '2026-06-01 19:04:21'),
(8, 2, 16480000.00, 'receive', 'Nhận tiền thanh toán đơn hàng #6 (Ví giải ngân)', '2026-06-01 19:23:56'),
(9, 4, 400000.00, 'deposit', 'Nạp tiền vào ví điện tử', '2026-06-01 20:35:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `buyer_id` (`buyer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shops`
--
ALTER TABLE `shops`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wallet_id` (`wallet_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `shops`
--
ALTER TABLE `shops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `disputes`
--
ALTER TABLE `disputes`
  ADD CONSTRAINT `disputes_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shops`
--
ALTER TABLE `shops`
  ADD CONSTRAINT `shops_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
