# IBOV Control - Investment Monitoring and Management System

## 📌 About the Project

IBOV Control is a comprehensive web platform for tracking and managing investments in the Brazilian stock market. The system allows real-time asset monitoring, portfolio management, technical analysis visualization with support and resistance levels, and detailed operation tracking.

## 🎯 Main Features

### 📊 Market Dashboard (/dashboard)
- **Market Overview**: Real-time statistics (total assets, average variation, assets in gain/loss)
- **Flexible Visualization**: Toggle between table and card views
- **Technical Analysis**: Support and resistance indicators with visual status (Strong Support, Support, Neutral, Resistance, Strong Resistance)
- **Advanced Search**: Filters by ticker, name, variation, and volume
- **Smart Sorting**: Sort by any criteria (price, variation, volume, etc.)
- **Real-Time Updates**: Data synchronized with Google Sheets

### 💼 Portfolio Management (/carteira)
- **Personalized Portfolio**: Track your assets with average price and quantity
- **Operations Log**: Complete history of purchases and sales with notes
- **Performance Analysis**:
  - Automatic profit/loss calculation in BRL and %
  - Total invested vs. current value
  - Total portfolio return
- **Visual Indicators**: Status of each asset in relation to support and resistance levels
- **Complete Management**: Add, edit, remove assets and record operations

### 🛠️ Admin Panel (/admin)
- **User Management**: View and modify access profiles
- **Technical Analysis Configuration**:
  - Define 3 support levels and 3 resistance levels for each asset
  - Add observations and justifications for each level
  - Track who modified and when
- **Intuitive Interface**: Inline editing of technical values
- **Access Control**: Restricted to administrators only

## 📄 Spreadsheet Structure

The Google Sheets spreadsheet must contain the following columns:

| Column | Description |
|--------|-----------|
| SIGLA | Stock ticker (e.g., PETR4) |
| REFERENCIA | Company name or title (e.g., Petrobras PN) |
| PRECO ATUAL | Current stock price |
| VARIACAO | Difference from previous day |
| VARIAÇÃO PERCENTUAL | Variation in % |
| VOLUME | Trading volume for the day |
| VALOR MERCADO | Total market value |
| ULTIMA ATUALIZACAO | Last update date and time |

## 🛠️ Technologies Used

- **Frontend**: React 18 + TypeScript + Vite 5
- **UI Components**: shadcn/ui (Radix UI) + Tailwind CSS
- **Charts**: ApexCharts + Recharts
- **Backend**: Supabase (authentication, PostgreSQL database, RLS)
- **Global State**: React Query (TanStack Query v5)
- **Routing**: React Router DOM v6
- **Data Source**: Google Sheets API (real-time integration)
- **Validation**: Zod + React Hook Form
- **Date Formatting**: date-fns

## 🚀 Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Configured Google Sheets spreadsheet

### Installation Steps

1. **Clone the repository**
```bash
git clone <REPOSITORY_URL>
cd ibovcontrol
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets (optional)
VITE_GOOGLE_API_KEY=your_google_api_key
```

4. **Configure Supabase**
- Create a project on [Supabase](https://supabase.com)
- Execute the SQL script `supabase_setup.sql` in the SQL Editor
- Configure security policies (Row Level Security)

5. **Configure Google Sheets**
- Create a spreadsheet with the structure specified above
- Make the spreadsheet public or configure an API key
- Update the `SPREADSHEET_ID` in the `src/services/googleSheets.ts` file

6. **Run the project**
```bash
npm run dev
```

## 🗄️ Database Structure

### Role System
The system uses the `raw_user_meta_data` field from Supabase's `auth.users` table to store user roles:
- **cliente**: Standard user with access to basic features
- **admin**: Administrator with access to the admin panel

### `carteira` Table
```sql
CREATE TABLE carteira (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo_codigo TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  preco_medio DECIMAL(10,2) NOT NULL,
  data_compra DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Security Policies
- Each user can only view and modify their own data
- Authentication required for all operations
- Automatic triggers for timestamps

## 🔧 Spreadsheet Configuration

### Method 1: Public Spreadsheet
1. Create the spreadsheet in Google Sheets
2. Click "Share" → "Anyone with the link can view"
3. Copy the spreadsheet ID from the URL
4. The system will use the public method to fetch data

### Method 2: API Key (Recommended)
1. Create a project in Google Cloud Console
2. Enable the Google Sheets API
3. Create an API Key
4. Add the key to the `.env` file
5. The system will use the official API to fetch data

## 📱 Implemented Features

### Market Dashboard ✅
- ✅ Display all assets synchronized from Google Sheets
- ✅ Real-time statistics cards (total assets, average variation, assets in gain/loss)
- ✅ Two views: complete table and visual cards
- ✅ Technical analysis system with support and resistance
- ✅ Visual status indicators (Strong Support → Strong Resistance)
- ✅ Smart search by ticker or name
- ✅ Multiple sorting options (ticker, price, variation, volume)
- ✅ Fully responsive layout
- ✅ On-demand manual updates
- ✅ Brazilian value formatting (R$, %, volume)

### Portfolio ✅
- ✅ Complete authentication system via Supabase
- ✅ Add multiple assets with quantity and average price
- ✅ Complete operations history (buy/sell)
- ✅ Notes field for each operation
- ✅ Automatic profitability calculation per asset and total
- ✅ Visual cards with technical status of each asset
- ✅ Detailed financial summary (invested, current, profit/loss)
- ✅ Complete management: add, edit, remove assets and operations
- ✅ Real-time integration with updated prices
- ✅ Support and resistance visualization in portfolio

### Admin Panel ✅
- ✅ Authentication with profile-based access control (admins only)
- ✅ Complete user management
- ✅ Access profile modification (client/admin)
- ✅ Technical analysis configuration for each asset:
  - 3 support levels
  - 3 resistance levels
  - Notes/reason field for each level
- ✅ Inline editing of technical values
- ✅ Audit system (user and modification date)
- ✅ Intuitive and professional admin interface

## 🔒 Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security in the database
- **Validation**: Data validation on frontend and backend
- **HTTPS**: All communications are encrypted
- **Rate Limiting**: Protection against API abuse

## 🚀 Deployment

### Deploy on Lovable
1. Access [Lovable](https://lovable.dev)
2. Connect your repository
3. Configure environment variables
4. Click "Publish"

### Manual Deploy
```bash
npm run build
# Upload the files from the dist/ folder to your server
```

## 📞 Support

For questions or issues:
1. Check the Supabase documentation
2. Check browser console logs
3. Verify the spreadsheet is accessible
4. Confirm environment variables are correct

## 🎨 Interface Highlights

- **Modern Design**: Clean and professional interface with shadcn/ui
- **Dark Mode**: Full dark theme support (in development)
- **Responsiveness**: Works perfectly on mobile, tablet, and desktop
- **Visual Feedback**: Toasts, colored badges, and status indicators
- **Performance**: Optimized loading with React Query and smart caching
- **Accessibility**: Accessible components with Radix UI

## 🔄 Roadmap - Upcoming Features

- [ ] Interactive candlestick charts for historical analysis
- [ ] Price alert system via email/notification
- [ ] Dashboard with portfolio performance charts
- [ ] Automatic technical analysis (moving averages, RSI, MACD)
- [ ] PDF/Excel report export
- [ ] Push notification system
- [ ] Integration with B3 and other data sources
- [ ] Dark mode
- [ ] Mobile app with React Native
- [ ] Public API for developers

---

**Developed with ❤️ for the Brazilian investor community**
