# 🛡️ LegalGuard Chrome Extension

**Author:** Dr. Šarūnas Grigaliūnas  
**Version:** 1.0.0  
**License:** MIT

LegalGuard is a comprehensive Chrome extension designed to assess the legality of web content through automated checks and AI-powered analysis. The extension provides real-time warnings about potentially illegal content, security vulnerabilities, and suspicious website characteristics.

## Features

### Core Functionality
- **Real-time Content Analysis**: Continuous monitoring of visited websites with immediate visual feedback
- **Multi-layered Detection System**: Combines database lookups, file analysis, and security assessments
- **AI-Powered Content Review**: Optional deep content analysis using OpenAI's GPT models
- **Configurable Thresholds**: Customizable parameters for SSL certificate age and domain registration warnings

### Detection Capabilities
- **Illegal Content Databases**: Automated verification against configurable online databases
- **Torrent File Detection**: Identification of .torrent files and magnet links on web pages
- **SSL Certificate Validation**: Assessment of certificate age and security status
- **Domain Age Analysis**: Warning system for newly registered domains
- **Manual AI Analysis**: On-demand content assessment for ambiguous cases

### Visual Indicators
- **Color-Coded Status System**: Green for safe content, yellow for warnings, red for illegal content
- **Floating Shield Icon**: Unobtrusive indicator positioned in the top-right corner of web pages
- **Detailed Information Panel**: Expandable interface showing analysis results and recommendations
- **Badge Notifications**: Browser action badge displaying current page status

## Installation Instructions

### Prerequisites
- Google Chrome browser (version 88 or higher)
- Chrome Developer Mode enabled
- OpenAI API key (optional, for AI analysis features)

### Step-by-Step Installation

1. **Download the Extension Files**
   Clone this repository or download the source code as a ZIP file:
   ```bash
   git clone https://github.com/yourusername/legalguard-extension.git
   cd legalguard-extension
   ```

2. **Prepare Icon Assets**
   Create an `icons` folder in the extension directory and add the following PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels)  
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

3. **Enable Chrome Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the extension directory containing the manifest.json file
   - Verify the extension appears in the extensions list with the LegalGuard name and icon

5. **Configure Settings**
   - Click the LegalGuard icon in the Chrome toolbar
   - Select "Settings" from the popup menu
   - Configure detection parameters according to your requirements
   - Add your OpenAI API key if you wish to use AI analysis features

## Testing Instructions

### Basic Functionality Testing

#### Test Safe Content Detection
1. Navigate to a well-established website such as `https://www.google.com`
2. Observe the LegalGuard shield icon in the top-right corner
3. Verify the icon displays green coloring indicating safe content
4. Click the shield icon to expand the information panel
5. Confirm the status shows "Content Safe" with no detected issues

#### Test Warning Conditions
1. **SSL Certificate Testing**: Navigate to a website without HTTPS or with a recently issued certificate
2. **Domain Age Testing**: Visit a newly registered domain (less than 14 days old)
3. Verify the shield icon turns yellow
4. Check that the information panel displays specific warning reasons
5. Confirm the warning details are clearly explained in the expandable panel

#### Test Illegal Content Detection
1. **Torrent File Testing**: Create a test HTML page containing links to .torrent files or magnet links
2. **Database Testing**: Configure a test database endpoint that returns positive matches for specific URLs
3. Navigate to the test page and verify the shield icon turns red
4. Confirm the status indicates "Illegal Content Detected"
5. Validate that specific detection reasons are displayed in the information panel

### Advanced Feature Testing

#### AI Analysis Testing
1. **API Configuration**: Enter a valid OpenAI API key in the extension settings
2. **Enable AI Analysis**: Toggle the AI analysis feature in the settings panel
3. **Test AI Functionality**: Navigate to a webpage with ambiguous content
4. Click the "AI Analysis" button in the extension popup or content panel
5. Verify the AI provides a risk assessment with explanation
6. Confirm the analysis result is properly categorized as high, medium, or low risk

#### Settings and Configuration Testing
1. **Access Settings Page**: Right-click the extension icon and select "Options"
2. **Modify Detection Parameters**: Adjust SSL certificate age and domain registration thresholds
3. **Database Management**: Add and remove illegal content database URLs
4. **Settings Persistence**: Verify settings are saved and retained across browser sessions
5. **Reset Functionality**: Test the reset to defaults option

### Performance and Compatibility Testing

#### Cross-Site Testing
Test the extension across various website types to ensure consistent performance:
- E-commerce sites with SSL certificates
- News websites with multimedia content
- Social media platforms
- Government and educational domains
- Newly launched websites and domains

#### Browser Performance Testing
1. **Memory Usage**: Monitor Chrome's task manager during extended browsing sessions
2. **Page Load Impact**: Compare page loading times with and without the extension enabled
3. **Background Processing**: Verify the extension operates efficiently without blocking page rendering

### Error Handling Testing

#### Network Connectivity Testing
1. **Offline Scenarios**: Test extension behavior when internet connectivity is unavailable
2. **API Timeouts**: Simulate slow network conditions and verify graceful timeout handling
3. **Database Unavailability**: Test scenarios where illegal content databases are unreachable

#### Invalid Configuration Testing
1. **Malformed API Keys**: Enter invalid OpenAI API keys and verify error handling
2. **Invalid Database URLs**: Add malformed database URLs and test error responses
3. **Extreme Parameter Values**: Set detection thresholds to extreme values and validate behavior

## Configuration Options

### Detection Parameters
- **SSL Certificate Age Warning**: Set the minimum certificate age (in days) before triggering warnings
- **Domain Registration Age Warning**: Configure the threshold for newly registered domain alerts
- **Torrent Detection**: Enable or disable automatic detection of torrent-related content

### Database Configuration
- **Illegal Content Databases**: Manage the list of online databases used for content verification
- **Database Response Format**: Ensure configured databases return JSON responses with boolean illegal/blocked fields

### AI Analysis Settings
- **OpenAI API Integration**: Configure API credentials for enhanced content analysis
- **Analysis Scope**: Control which types of content trigger automatic AI review
- **Risk Assessment Thresholds**: Customize the criteria for high, medium, and low risk classifications

## Troubleshooting

### Common Issues

#### Extension Not Loading
- Verify all required files are present in the extension directory
- Check that manifest.json is properly formatted and contains no syntax errors
- Ensure Chrome Developer Mode is enabled

#### API Connection Failures
- Validate OpenAI API key format and permissions
- Test API connectivity using the built-in connection test feature
- Verify network connectivity and firewall settings

#### Inconsistent Detection Results
- Review database configuration and response formats
- Check SSL certificate and domain age parameter settings
- Verify the extension has necessary permissions for web requests

### Support and Documentation

For additional support, configuration assistance, or to report bugs, please refer to the project documentation or create an issue in the GitHub repository. The extension includes comprehensive logging capabilities that can assist in diagnosing configuration or performance issues.

## Privacy and Security

LegalGuard prioritizes user privacy and security. The extension operates with minimal data collection, storing configuration settings locally within Chrome's storage system. API communications are encrypted and occur only when explicitly requested by the user. No browsing data or analysis results are transmitted to external services except for the configured illegal content databases and optional AI analysis requests.

## License

This project is licensed under the MIT License. See the LICENSE file for complete terms and conditions.
