import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(app.getPath('userData'), 'gym_data.json');

function getDynamicPPLData() {
  const now = new Date();
  // Get Monday of current week
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(18, 0, 0, 0); // 6 PM
  
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);
  
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const createSet = (reps, weight) => ({
    id: Math.random().toString(36).substring(7),
    repsTarget: reps,
    repsActual: reps,
    weight: weight,
    unit: 'lb',
    isCompleted: false
  });

  return {
    sessions: [
      {
        id: 'push-1',
        title: 'Push Day (Chest, Shoulders, Triceps)',
        date: monday.toISOString(),
        duration: 60,
        type: 'Strength',
        notes: 'Focus on progressive overload for bench press.',
        isCompleted: false,
        exercises: [
          {
            id: 'ex-1', name: 'Barbell Bench Press', targetMuscle: 'Chest', restTime: 120, notes: '',
            sets: [createSet(8, 135), createSet(8, 135), createSet(8, 135)]
          },
          {
            id: 'ex-2', name: 'Overhead Press', targetMuscle: 'Shoulders', restTime: 90, notes: '',
            sets: [createSet(10, 95), createSet(10, 95), createSet(10, 95)]
          }
        ]
      },
      {
        id: 'pull-1',
        title: 'Pull Day (Back, Biceps)',
        date: wednesday.toISOString(),
        duration: 60,
        type: 'Strength',
        notes: '',
        isCompleted: false,
        exercises: [
          {
            id: 'ex-3', name: 'Barbell Row', targetMuscle: 'Back', restTime: 120, notes: '',
            sets: [createSet(10, 135), createSet(10, 135), createSet(10, 135)]
          }
        ]
      },
      {
        id: 'legs-1',
        title: 'Leg Day (Quads, Hams, Calves)',
        date: friday.toISOString(),
        duration: 60,
        type: 'Strength',
        notes: '',
        isCompleted: false,
        exercises: [
          {
            id: 'ex-4', name: 'Barbell Squat', targetMuscle: 'Legs', restTime: 120, notes: '',
            sets: [createSet(8, 185), createSet(8, 185), createSet(8, 185)]
          }
        ]
      }
    ],
    routines: [],
    exercises: [],
    history: []
  };
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify(getDynamicPPLData(), null, 2));
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f172a' // Dark slate background matching dark mode
  });

  // Because Vite defaults to 5173
  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  
  // Note: when running concurrently, it might take a second for vite to start.
  // Electron might load it instantly, but if it fails, it will be white screen.
  // Best to just load the URL.
  if (isDev) {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for local JSON database
ipcMain.handle('read-data', () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read data:', error);
    return getDynamicPPLData();
  }
});

ipcMain.handle('write-data', (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to write data:', error);
    return false;
  }
});
