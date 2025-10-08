import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, Archive, Clock, MapPin, Filter, Download, Eye, X, Printer, QrCode, FolderOpen, ChevronRight, ChevronDown, Tag, User, AlertCircle, Settings, FileDown, Folder, Files, Cloud, RefreshCw, Save, BookOpen, FileType } from 'lucide-react';

// ⚠️ LINE 6: Yaha apna Google Apps Script URL paste karo
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9Qvh31x2D24CVxYESOS6dXykLWw1tcHgyqH7sj8n4WrJMg6u6xr1ynRqqe1eJOyGO/exec';

const FileOrganizerSystem = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubFileModal, setShowSubFileModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const searchRef = useRef(null);

  const [formData, setFormData] = useState({
    fileNumber: '', fileName: '', fileType: 'Brown File', customFileType: '', category: '', almirah: '', rack: '', row: '', column: '', pages: 0, status: 'Active', description: '', tags: [], assignedTo: '', priority: 'Medium', updateNote: '', newTag: ''
  });

  const [subFileForm, setSubFileForm] = useState({ name: '', type: 'Brown File', customType: '', count: 1, pages: 0 });
  const [movementForm, setMovementForm] = useState({ fromLocation: '', toLocation: '', movedBy: '', reason: '' });
  const [autoNumberSettings, setAutoNumberSettings] = useState({ enabled: true, prefix: 'FILE', year: true, counter: 3 });

  const categories = ['HR', 'Finance', 'Legal', 'Projects', 'Sales', 'Operations', 'Marketing', 'IT', 'Admin', 'Other'];
  const statuses = ['Active', 'Archived', 'Under Review', 'Pending', 'Completed', 'In Transit'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const fileTypes = ['Brown File', 'Pink File', 'White Backing', 'Register', 'Others'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { loadFromDrive(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (files.length > 0 && GOOGLE_APPS_SCRIPT_URL !== 'YAHA_APNA_GOOGLE_APPS_SCRIPT_URL_PASTE_KARO') {
        saveToDrive(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [files]);

  const loadFromDrive = async () => {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'YAHA_APNA_GOOGLE_APPS_SCRIPT_URL_PASTE_KARO') {
      loadDemoData();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getFiles`);
      const result = await response.json();
      if (result.status === 'success' && result.data.files) {
        setFiles(result.data.files);
        setLastSyncTime(new Date().toLocaleString());
      } else {
        loadDemoData();
      }
    } catch (error) {
      console.error('Error:', error);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const saveToDrive = async (silent = false) => {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'YAHA_APNA_GOOGLE_APPS_SCRIPT_URL_PASTE_KARO') {
      if (!silent) alert('⚠️ Google Drive URL not configured.');
      return;
    }
    if (!silent) setSyncing(true);
    try {
      const data = { files };
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=saveFiles&data=${encodeURIComponent(JSON.stringify(data))}`
      });
      const result = await response.json();
      if (result.status === 'success') {
        setLastSyncTime(new Date().toLocaleString());
        if (!silent) alert('✅ Data saved to Google Drive!');
      }
    } catch (error) {
      console.error('Error:', error);
      if (!silent) alert('❌ Error saving to Google Drive.');
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  const loadDemoData = () => {
    setFiles([{
      id: 1, fileNumber: 'FILE-2024-001', fileName: 'Employee Records', fileType: 'Brown File', category: 'HR', almirah: 'A1', rack: '2', row: 'B', column: '3', pages: 150, status: 'Active', description: 'Employee documents', tags: ['Important'], assignedTo: 'HR Manager', priority: 'High', lastUpdated: '2024-10-08 14:30', createdDate: '2024-01-15',
      subFiles: [
        { id: 's1', name: 'Joining Letters', type: 'Brown File', count: 25, pages: 50, lastUpdated: '2024-10-08' }
      ],
      movements: [{ date: '2024-10-08 14:30', from: 'New', to: 'A1-R2-B3', movedBy: 'Admin', reason: 'File created', type: 'Creation' }],
      updates: [{ date: '2024-10-08 14:30', note: 'Initial creation', user: 'Admin' }]
    }]);
  };

  const generateFileNumber = () => {
    if (!autoNumberSettings.enabled) return '';
    let number = autoNumberSettings.prefix;
    if (autoNumberSettings.year) number += '-' + new Date().getFullYear();
    const maxNumber = files.reduce((max, file) => {
      const match = file.fileNumber.match(/\d+$/);
      return match ? Math.max(max, parseInt(match[0])) : max;
    }, 0);
    const nextNumber = (maxNumber + 1).toString().padStart(autoNumberSettings.counter, '0');
    return number + '-' + nextNumber;
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
  };

  const stats = useMemo(() => {
    const totalSubFiles = files.reduce((sum, f) => sum + (f.subFiles?.length || 0), 0);
    const totalRegisters = files.reduce((sum, f) => {
      const mainRegister = f.fileType === 'Register' ? 1 : 0;
      const subRegisters = (f.subFiles || []).filter(sf => sf.type === 'Register').length;
      return sum + mainRegister + subRegisters;
    }, 0);
    const totalPages = files.reduce((sum, f) => {
      const mainPages = f.pages || 0;
      const subPages = (f.subFiles || []).reduce((s, sf) => s + (sf.pages || 0), 0);
      return sum + mainPages + subPages;
    }, 0);
    return {
      total: files.length,
      active: files.filter(f => f.status === 'Active').length,
      archived: files.filter(f => f.status === 'Archived').length,
      categories: [...new Set(files.map(f => f.category))].length,
      urgent: files.filter(f => f.priority === 'Urgent').length,
      subFiles: totalSubFiles,
      registers: totalRegisters,
      totalPages: totalPages
    };
  }, [files]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const suggestions = new Set();
    const term = searchTerm.toLowerCase();
    files.forEach(file => {
      if (file.fileName.toLowerCase().includes(term)) suggestions.add(file.fileName);
      if (file.fileNumber.toLowerCase().includes(term)) suggestions.add(file.fileNumber);
      if (file.category.toLowerCase().includes(term)) suggestions.add(file.category);
      if (file.almirah.toLowerCase().includes(term)) suggestions.add(`Almirah ${file.almirah}`);
      (file.tags || []).forEach(tag => { if (tag.toLowerCase().includes(term)) suggestions.add(tag); });
      (file.subFiles || []).forEach(sf => { if (sf.name.toLowerCase().includes(term)) suggestions.add(sf.name); });
    });
    return Array.from(suggestions).slice(0, 10);
  }, [searchTerm, files]);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || file.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) || file.description.toLowerCase().includes(searchTerm.toLowerCase()) || file.fileType.toLowerCase().includes(searchTerm.toLowerCase()) || file.almirah.toLowerCase().includes(searchTerm.toLowerCase()) || (file.tags && file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) || (file.subFiles && file.subFiles.some(sf => sf.name.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = filterCategory === 'All' || file.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || file.status === filterStatus;
      const matchesPriority = filterPriority === 'All' || file.priority === filterPriority;
      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [files, searchTerm, filterCategory, filterStatus, filterPriority]);

  const handleAddEdit = () => {
    if (!formData.fileNumber || !formData.fileName) {
      alert('File Number and File Name required!');
      return;
    }
    const finalFileType = formData.fileType === 'Others' ? formData.customFileType : formData.fileType;
    if (formData.fileType === 'Others' && !formData.customFileType) {
      alert('Enter custom type for Others');
      return;
    }
    const currentDateTime = getCurrentDateTime();
    const currentLocation = `${formData.almirah}-R${formData.rack}-${formData.row}${formData.column}`;
    
    if (selectedFile) {
      const updatedFiles = files.map(f => {
        if (f.id === selectedFile.id) {
          const oldLocation = `${f.almirah}-R${f.rack}-${f.row}${f.column}`;
          const locationChanged = oldLocation !== currentLocation;
          const statusChanged = f.status !== formData.status;
          const newMovements = [...(f.movements || [])];
          if (locationChanged || statusChanged) {
            newMovements.push({
              date: currentDateTime, from: oldLocation, to: currentLocation, movedBy: formData.assignedTo || 'Admin',
              reason: formData.updateNote || (statusChanged ? `Status changed to ${formData.status}` : 'Location updated'),
              type: statusChanged ? 'Status Change' : 'Movement'
            });
          }
          const updates = formData.updateNote ? [...(f.updates || []), { date: currentDateTime, note: formData.updateNote, user: formData.assignedTo || 'Admin' }] : f.updates || [];
          return { ...f, ...formData, fileType: finalFileType, lastUpdated: currentDateTime, movements: newMovements, updates };
        }
        return f;
      });
      setFiles(updatedFiles);
    } else {
      const newFile = {
        id: Date.now(), ...formData, fileType: finalFileType, createdDate: new Date().toISOString().split('T')[0], lastUpdated: currentDateTime, subFiles: [],
        movements: [{ date: currentDateTime, from: 'New', to: currentLocation, movedBy: formData.assignedTo || 'Admin', reason: 'File created', type: 'Creation' }],
        updates: formData.updateNote ? [{ date: currentDateTime, note: formData.updateNote, user: formData.assignedTo || 'Admin' }] : []
      };
      setFiles([...files, newFile]);
    }
    closeModal();
    saveToDrive(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this file?')) {
      setFiles(files.filter(f => f.id !== id));
      saveToDrive(true);
    }
  };

  const openModal = (file = null) => {
    if (file) {
      setSelectedFile(file);
      setFormData({ fileNumber: file.fileNumber, fileName: file.fileName, fileType: file.fileType, customFileType: '', category: file.category, almirah: file.almirah, rack: file.rack, row: file.row, column: file.column, pages: file.pages || 0, status: file.status, description: file.description, tags: file.tags || [], assignedTo: file.assignedTo || '', priority: file.priority || 'Medium', updateNote: '', newTag: '' });
    } else {
      setSelectedFile(null);
      const newFileNumber = generateFileNumber();
      setFormData({ fileNumber: newFileNumber, fileName: '', fileType: 'Brown File', customFileType: '', category: '', almirah: '', rack: '', row: '', column: '', pages: 0, status: 'Active', description: '', tags: [], assignedTo: '', priority: 'Medium', updateNote: '', newTag: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setSelectedFile(null); };
  const viewDetails = (file) => { setSelectedFile(file); setShowDetailModal(true); };
  
  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, formData.newTag], newTag: '' });
    }
  };
  
  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const openSubFileModal = (file) => {
    setSelectedFile(file);
    setSubFileForm({ name: '', type: 'Brown File', customType: '', count: 1, pages: 0 });
    setShowSubFileModal(true);
  };

  const addSubFile = () => {
    if (!subFileForm.name) {
      alert('Sub-file name required!');
      return;
    }
    const finalType = subFileForm.type === 'Others' ? subFileForm.customType : subFileForm.type;
    if (subFileForm.type === 'Others' && !subFileForm.customType) {
      alert('Enter custom type for Others');
      return;
    }
    const updatedFiles = files.map(f => {
      if (f.id === selectedFile.id) {
        const newSubFile = {
          id: 'sf' + Date.now(), name: subFileForm.name, type: finalType, count: parseInt(subFileForm.count) || 1, pages: parseInt(subFileForm.pages) || 0, lastUpdated: new Date().toISOString().split('T')[0]
        };
        return { ...f, subFiles: [...(f.subFiles || []), newSubFile], lastUpdated: getCurrentDateTime() };
      }
      return f;
    });
    setFiles(updatedFiles);
    setSubFileForm({ name: '', type: 'Brown File', customType: '', count: 1, pages: 0 });
    saveToDrive(true);
  };

  const deleteSubFile = (fileId, subFileId) => {
    if (window.confirm('Delete sub-file?')) {
      const updatedFiles = files.map(f => {
        if (f.id === fileId) {
          return { ...f, subFiles: (f.subFiles || []).filter(sf => sf.id !== subFileId) };
        }
        return f;
      });
      setFiles(updatedFiles);
      saveToDrive(true);
    }
  };

  const openMovementModal = (file) => {
    setSelectedFile(file);
    setMovementForm({ fromLocation: `${file.almirah}-R${file.rack}-${file.row}${file.column}`, toLocation: '', movedBy: '', reason: '' });
    setShowMovementModal(true);
  };

  const addMovement = () => {
    if (!movementForm.toLocation || !movementForm.movedBy) {
      alert('Location and person name required!');
      return;
    }
    const updatedFiles = files.map(f => {
      if (f.id === selectedFile.id) {
        const newMovement = { date: getCurrentDateTime(), from: movementForm.fromLocation, to: movementForm.toLocation, movedBy: movementForm.movedBy, reason: movementForm.reason || 'Manual movement', type: 'Movement' };
        const locationParts = movementForm.toLocation.split('-');
        const almirah = locationParts[0];
        const rack = locationParts[1]?.replace('R', '') || '';
        const rowCol = locationParts[2] || '';
        const row = rowCol.charAt(0);
        const column = rowCol.slice(1);
        return { ...f, almirah, rack, row, column, status: 'In Transit', movements: [...(f.movements || []), newMovement], lastUpdated: getCurrentDateTime() };
      }
      return f;
    });
    setFiles(updatedFiles);
    setShowMovementModal(false);
    saveToDrive(true);
  };

  const toggleExpand = (fileId) => { setExpandedFiles(prev => ({ ...prev, [fileId]: !prev[fileId] })); };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(files, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `file-records-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['File Number', 'File Name', 'File Type', 'Category', 'Location', 'Pages', 'Sub-Files', 'Status', 'Priority'];
    const rows = files.map(f => [f.fileNumber, f.fileName, f.fileType, f.category, `${f.almirah}-R${f.rack}-${f.row}${f.column}`, f.pages || 0, f.subFiles?.length || 0, f.status, f.priority]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `file-records-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generateQR = (file) => { setSelectedFile(file); setShowQRModal(true); };

  const getStatusColor = (status) => {
    const colors = { 'Active': 'bg-green-100 text-green-800 border-green-200', 'Archived': 'bg-gray-100 text-gray-800 border-gray-200', 'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200', 'Pending': 'bg-blue-100 text-blue-800 border-blue-200', 'Completed': 'bg-purple-100 text-purple-800 border-purple-200', 'In Transit': 'bg-orange-100 text-orange-800 border-orange-200' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = { 'Low': 'bg-gray-100 text-gray-600', 'Medium': 'bg-blue-100 text-blue-600', 'High': 'bg-orange-100 text-orange-600', 'Urgent': 'bg-red-100 text-red-600' };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const getFileTypeColor = (type) => {
    const colors = { 'Brown File': 'bg-amber-100 text-amber-800 border-amber-200', 'Pink File': 'bg-pink-100 text-pink-800 border-pink-200', 'White Backing': 'bg-slate-100 text-slate-800 border-slate-200', 'Register': 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    return colors[type] || 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  const getTotalSubFileCount = (file) => { return (file.subFiles || []).reduce((sum, sf) => sum + (sf.count || 0), 0); };
  const getTotalPages = (file) => {
    const mainPages = file.pages || 0;
    const subPages = (file.subFiles || []).reduce((sum, sf) => sum + (sf.pages || 0), 0);
    return mainPages + subPages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud size={64} className="mx-auto text-blue-600 animate-bounce mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <FileText className="text-white" size={32} />
                </div>
                Ultimate File Management System
              </h1>
              <p className="text-gray-600 mt-2 ml-14 flex items-center gap-2">
                <Cloud size={16} />
                Powered by Google Drive
                {lastSyncTime && <span className="text-xs text-green-600">• Last sync: {lastSyncTime}</span>}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => loadFromDrive()} className="bg-blue-100 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-200 transition-all">
                <RefreshCw size={20} />
              </button>
              <button onClick={() => saveToDrive(false)} disabled={syncing} className="bg-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-green-200 transition-all disabled:opacity-50">
                {syncing ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all">
                <Settings size={20} />
              </button>
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                <Plus size={20} />
                Add New File
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 File Management System Ready!</h2>
          <p className="text-gray-700 mb-3">
            {GOOGLE_APPS_SCRIPT_URL === 'YAHA_APNA_GOOGLE_APPS_SCRIPT_URL_PASTE_KARO' ? (
              <span className="text-red-600 font-semibold">⚠️ Google Drive not configured. Showing demo data.</span>
            ) : (
              <span className="text-green-600 font-semibold">✅ Google Drive connected!</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="text-blue-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600 font-medium">Total Files</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="text-green-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-600 font-medium">Active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-gray-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Archive className="text-gray-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              <p className="text-xs text-gray-600 font-medium">Archived</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Filter className="text-indigo-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-indigo-600">{stats.categories}</p>
              <p className="text-xs text-gray-600 font-medium">Categories</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              <p className="text-xs text-gray-600 font-medium">Urgent</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Folder className="text-purple-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.subFiles}</p>
              <p className="text-xs text-gray-600 font-medium">Sub-Files</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="text-emerald-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.registers}</p>
              <p className="text-xs text-gray-600 font-medium">Registers</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border">
            <div className="text-center">
              <div className="bg-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileType className="text-cyan-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-cyan-600">{stats.totalPages}</p>
              <p className="text-xs text-gray-600 font-medium">Total Pages</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="md:col-span-2 relative" ref={searchRef}>
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(e.target.value.length >= 2); }} onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion, idx) => (
                    <button key={idx} onClick={() => { setSearchTerm(suggestion); setShowSuggestions(false); }} className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 flex items-center gap-2">
                      <Search size={16} className="text-gray-400" />
                      <span className="text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-3 border rounded-xl">
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 border rounded-xl">
              <option value="All">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-3 border rounded-xl">
              <option value="All">All Priority</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex gap-2">
              <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-xl ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Table</button>
              <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-xl ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Grid</button>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 text-sm"><FileDown size={16} className="inline mr-1" /> CSV</button>
              <button onClick={exportToJSON} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 text-sm"><Download size={16} className="inline mr-1" /> JSON</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"><Printer size={16} className="inline mr-1" /> Print</button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">File Info</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Pages</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFiles.map((file) => (
                  <React.Fragment key={file.id}>
                    <tr className="hover:bg-blue-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {file.subFiles?.length > 0 && (
                            <button onClick={() => toggleExpand(file.id)} className="text-gray-400">
                              {expandedFiles[file.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          )}
                          <div>
                            <div className="font-mono text-sm font-semibold">{file.fileNumber}</div>
                            <div className="text-sm font-medium">{file.fileName}</div>
                            <div className="text-xs text-gray-500 mt-1">{file.lastUpdated}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getFileTypeColor(file.fileType)}`}>{file.fileType}</span>
                        <div className="text-xs text-gray-500 mt-1">{file.category}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin size={14} className="text-red-500" />
                          <span className="font-semibold">{file.almirah}</span>-R{file.rack}-{file.row}{file.column}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold">{getTotalPages(file)}</div>
                        <div className="text-xs text-gray-500">Main: {file.pages || 0}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(file.status)}`}>{file.status}</span>
                        <div className="mt-1"><span className={`px-2 py-0.5 text-xs font-bold rounded ${getPriorityColor(file.priority)}`}>{file.priority}</span></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => viewDetails(file)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="View"><Eye size={16} /></button>
                          <button onClick={() => openSubFileModal(file)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg" title="Sub-Files"><FolderOpen size={16} /></button>
                          <button onClick={() => openMovementModal(file)} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg" title="Move"><MapPin size={16} /></button>
                          <button onClick={() => generateQR(file)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg" title="QR"><QrCode size={16} /></button>
                          <button onClick={() => openModal(file)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(file.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedFiles[file.id] && file.subFiles?.length > 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-3 bg-gray-50">
                          <div className="ml-8 space-y-2">
                            <div className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                              <Folder size={18} className="text-purple-600" />
                              Sub-Files ({file.subFiles.length}):
                            </div>
                            {file.subFiles.map(sf => (
                              <div key={sf.id} className="flex items-center justify-between bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 flex-1">
                                  <Files size={18} className="text-purple-600" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{sf.name}</span>
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getFileTypeColor(sf.type)}`}>{sf.type}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 flex gap-4">
                                      <span>Count: <strong>{sf.count}</strong></span>
                                      <span>Pages: <strong>{sf.pages || 0}</strong></span>
                                      <span>Updated: {sf.lastUpdated}</span>
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => deleteSubFile(file.id, sf.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"><Trash2 size={16} /></button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {filteredFiles.length === 0 && (
              <div className="text-center py-16">
                <FileText className="mx-auto text-gray-300" size={64} />
                <p className="text-gray-500 mt-4 text-lg">No files found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map(file => (
              <div key={file.id} className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="font-mono text-xs font-semibold text-gray-500">{file.fileNumber}</div>
                    <h3 className="font-bold text-lg text-gray-900 mt-1">{file.fileName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getFileTypeColor(file.fileType)}`}>{file.fileType}</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(file.priority)}`}>{file.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-red-500" />
                    <span className="font-semibold">{file.almirah}-R{file.rack}-{file.row}{file.column}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <FileType size={14} className="text-cyan-600" />
                      <span><strong>{getTotalPages(file)}</strong> pages</span>
                    </div>
                    {file.subFiles?.length > 0 && (
                      <div className="flex items-center gap-1 text-purple-600">
                        <Folder size={14} />
                        <span><strong>{file.subFiles.length}</strong> sub-files</span>
                      </div>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(file.status)}`}>{file.status}</span>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <button onClick={() => viewDetails(file)} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 text-sm font-medium">View</button>
                  <button onClick={() => openModal(file)} className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 text-sm font-medium">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileOrganizerSystem;
