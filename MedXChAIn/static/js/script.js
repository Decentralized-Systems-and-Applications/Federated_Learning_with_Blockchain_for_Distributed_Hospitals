// MedXChAIn Frontend Script - Advanced Dashboard with API Integration

// Chart.js instance
let performanceChart = null;
let currentTab = 'accuracy';
let isLoadingData = false;

// Data storage
const chartData = {
  accuracy: [45, 52, 58, 65, 70, 74, 78, 81, 83, 85, 87, 88],
  f1: [42, 49, 55, 62, 67, 71, 75, 78, 80, 82, 84, 85]
};

const hospitalData = [
  { name: 'Mayo Clinic - Central', participation: 98, models: 458 },
  { name: 'St. Jude Children\'s', participation: 84, models: 412 },
  { name: 'Cleveland Clinic', participation: 72, models: 389 }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePerformanceChart();
  populateHospitalData();
  setupAutoRefresh();
  initMap(); // Initialize global distribution map
});

// Initialize Chart.js performance chart
function initializePerformanceChart() {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;

  const canvasContainer = ctx.parentElement;
  const width = canvasContainer.offsetWidth;
  const height = 250;
  
  ctx.width = width;
  ctx.height = height;

  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12'],
      datasets: [{
        label: 'Accuracy (%)',
        data: chartData.accuracy,
        borderColor: '#0f1f3d',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0f1f3d',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        tension: 0.4,
        segment: {
          borderCapStyle: 'round',
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 31, 61, 0.9)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y.toFixed(1) + '%';
            }
          }
        },
        filler: {
          propagate: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(226, 232, 240, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: { size: 12, weight: '500' },
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { size: 12, weight: '500' }
          }
        }
      }
    }
  });
}

// Switch between accuracy and F1-score tabs with animation
function switchTab(tab) {
  if (isLoadingData) return;
  
  // Update active button
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  
  currentTab = tab;
  
  // Update chart data with smooth animation
  if (performanceChart) {
    performanceChart.data.datasets[0].data = chartData[tab];
    performanceChart.data.datasets[0].label = tab === 'accuracy' ? 'Accuracy (%)' : 'F1-Score (%)';
    performanceChart.update('none');
  }
}

// Populate hospital participation data with animations
function populateHospitalData() {
  const hospitalContainer = document.querySelector('.participation-card');
  if (!hospitalContainer) return;
  
  const hospitalRows = hospitalContainer.querySelectorAll('.hospital-row');
  
  hospitalRows.forEach((row, index) => {
    if (hospitalData[index]) {
      const hospital = hospitalData[index];
      const nameEl = row.querySelector('.hospital-name');
      const pctEl = row.querySelector('.hospital-pct');
      const barFill = row.querySelector('.bar-fill');
      
      if (nameEl) nameEl.textContent = hospital.name;
      if (pctEl) pctEl.textContent = hospital.participation + '%';
      if (barFill) {
        // Animate bar fill
        setTimeout(() => {
          barFill.style.width = hospital.participation + '%';
        }, index * 100);
      }
    }
  });
}

// Fetch data from API
async function fetchDashboardData() {
  try {
    isLoadingData = true;
    
    const response = await fetch('/api/dashboard-summary/');
    const data = await response.json();
    
    // Update stat cards if needed
    console.log('Dashboard data:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    isLoadingData = false;
  }
}

// Fetch hospital metrics
async function fetchHospitalData() {
  try {
    const response = await fetch('/api/hospital-metrics/');
    const data = await response.json();
    
    if (data.hospitals) {
      // Update hospital data dynamically
      console.log('Hospital metrics:', data.hospitals);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital data:', error);
  }
}

// Fetch model performance metrics
async function fetchPerformanceData(tab = 'accuracy') {
  try {
    const response = await fetch(`/api/model-performance/?tab=${tab}`);
    const data = await response.json();
    
    if (data.values) {
      // Update chart data
      chartData[tab] = data.values;
      if (performanceChart && currentTab === tab) {
        performanceChart.data.datasets[0].data = data.values;
        performanceChart.update('none');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching performance data:', error);
  }
}

// Setup auto-refresh of data
function setupAutoRefresh() {
  // Refresh dashboard data every 30 seconds
  setInterval(() => {
    fetchDashboardData();
    fetchHospitalData();
  }, 30000);
}

// Manual refresh function
function refreshDashboard() {
  console.log('Refreshing dashboard...');
  fetchDashboardData();
  fetchHospitalData();
  fetchPerformanceData(currentTab);
}

// Nav active state
function setActive(btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// Expose to global scope for HTML onclick handlers
window.switchTab = switchTab;
window.setActive = setActive;
window.refreshDashboard = refreshDashboard;

// Global Distribution Map
async function initMap() {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const projection = d3.geoNaturalEarth1()
    .scale(W / 4)
    .translate([W / 2, H / 2]);

  const path = d3.geoPath(projection, ctx);

  try {
    const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const countries = topojson.feature(world, world.objects.countries);

    const nodes = [
      [-95, 40],    // ABD
      [10, 52],    // Europe
      [103, 1.3],  // Southeast Asia
      [139, 36],   // Japan
      [151, -33],  // Australia
    ];

    let tick = 0;

    function drawMap() {
      ctx.clearRect(0, 0, W, H);

      // Ocean/background (light gray like the mock)
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, W, H);

      countries.features.forEach(f => {
        ctx.beginPath();
        path(f);
        // Land (slightly darker gray)
        ctx.fillStyle = '#9ca3af';
        ctx.fill();
        // Borders (subtle)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      nodes.forEach((coords, i) => {
        const [x, y] = projection(coords);
        const phase = (tick + i * 15) % 60;
        const pulse = phase < 30 ? phase / 30 : (60 - phase) / 30;

        ctx.save();
        ctx.globalAlpha = 0.15 + pulse * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 5, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
      });

      tick++;
      requestAnimationFrame(drawMap);
    }

    drawMap();
  } catch (error) {
    console.error('Error loading or drawing map:', error);
    // Draw a placeholder
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Map loading failed', W / 2, H / 2);
  }
}