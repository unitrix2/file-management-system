import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, Archive, Clock, MapPin, Filter, Download, Eye, X, Printer, QrCode, FolderOpen, ChevronRight, ChevronDown, Tag, User, AlertCircle, Settings, FileDown, Folder, Files, Cloud, RefreshCw, Save, BookOpen, FileType, Columns, View, List, CheckCircle, RotateCcw } from 'lucide-react';

// ⚠️ LINE 6: Yaha apna Google Apps Script URL paste karo
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9Qvh31x2D24CVxYESOS6dXykLWw1tcHgyqH7sj8n4WrJMg6u6xr1ynRqqe1eJOyGO/exec';

// --- Helper Components (Inhe aap alag files mein bhi rakh sakte hain) ---

const Modal = ({ title, show, onClose, children, size = 'lg' }) => {
  if (!show) return null;
  const sizeClasses = { 'sm': 'max-w-md', 'lg': 'max-w-3xl', 'xl': 'max-w-5xl' }[size] || 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses} transform transition-all duration-300 scale-100 opacity-100`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition"><X size={20} /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, colorClass }) => (
  <div className={`bg-white border-l-4 ${colorClass} rounded-lg shadow-md p-4 flex items-center justify-between transition duration-300 hover:shadow-lg transform hover:-translate-y-0.5`}>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace('-4', '-100')} text-opacity-80`}>
      <Icon size={24} />
    </div>
  </div>
);

// --- Main Component ---

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
  }, [files, searchTerm, filterCategory, filterStatus, filterPriority, filterPriority]);

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
      setFormData({ fileNumber: file.fileNumber, fileName: file.fileName, fileType: file.fileType, customFileType: file.fileType === 'Others' ? file.fileType : '', category: file.category, almirah: file.almirah, rack: file.rack, row: file.row, column: file.column, pages: file.pages || 0, status: file.status, description: file.description, tags: file.tags || [], assignedTo: file.assignedTo || '', priority: file.priority || 'Medium', updateNote: '', newTag: '' });
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
    if (formData.newTag && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, formData.newTag.trim()], newTag: '' });
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
    setShowSubFileModal(false);
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
        
        // Location update logic (Almirah-Rack-RowColumn)
        const locationParts = movementForm.toLocation.split('-');
        const almirah = locationParts[0] || f.almirah;
        const rack = locationParts[1]?.replace('R', '') || f.rack;
        const rowCol = locationParts[2] || '';
        const row = rowCol.charAt(0) || f.row;
        const column = rowCol.slice(1) || f.column;

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
    const headers = ['File Number', 'File Name', 'File Type', 'Category', 'Location', 'Pages', 'Sub-Files', 'Status', 'Priority', 'Description', 'Tags', 'Assigned To', 'Last Updated', 'Created Date'];
    const rows = files.map(f => [
        f.fileNumber, f.fileName, f.fileType, f.category, `${f.almirah}-R${f.rack}-${f.row}${f.column}`, f.pages || 0, f.subFiles?.length || 0, f.status, f.priority, f.description, (f.tags || []).join('|'), f.assignedTo, f.lastUpdated, f.createdDate
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

  // --- JSX Rendering Functions ---

  const renderFilterControls = () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Filter size={20} className="text-gray-500" />
      
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm">
        <option value="All">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm">
        <option value="All">All Statuses</option>
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm">
        <option value="All">All Priorities</option>
        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <button onClick={() => { setFilterCategory('All'); setFilterStatus('All'); setFilterPriority('All'); }} className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm transition">
        <RotateCcw size={16} /> Reset
      </button>
    </div>
  );

  const renderTableBody = () => (
    <tbody className="bg-white divide-y divide-gray-100">
      {filteredFiles.length === 0 ? (
        <tr>
          <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
            No files found matching your criteria.
          </td>
        </tr>
      ) : (
        filteredFiles.map((file) => (
          <React.Fragment key={file.id}>
            <tr className="hover:bg-gray-50 transition duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => viewDetails(file)}>
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-full ${getPriorityColor(file.priority)}`}>
                    <Tag size={12} />
                  </div>
                  {file.fileNumber}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.fileName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFileTypeColor(file.fileType)}`}>{file.fileType}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.category}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <MapPin size={16} className="inline mr-1 text-red-500" />
                {`${file.almirah}-R${file.rack}-${file.row}${file.column}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTotalPages(file)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(file.status)}`}>{file.status}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.lastUpdated.split(' ')[0]}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center space-x-2">
                <button onClick={() => viewDetails(file)} className="text-blue-600 hover:text-blue-900 p-1"><Eye size={18} /></button>
                <button onClick={() => openModal(file)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit2 size={18} /></button>
                <button onClick={() => openSubFileModal(file)} className="text-green-600 hover:text-green-900 p-1"><Files size={18} /></button>
                <button onClick={() => openMovementModal(file)} className="text-orange-600 hover:text-orange-900 p-1"><Clock size={18} /></button>
                <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={18} /></button>
                <button onClick={() => toggleExpand(file.id)} className="text-gray-600 hover:text-gray-900 p-1">
                  {expandedFiles[file.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              </td>
            </tr>
            {expandedFiles[file.id] && file.subFiles?.length > 0 && (
              <tr className="bg-gray-50">
                <td colSpan="9" className="px-6 py-4">
                  <div className="ml-8 border-l-2 border-dashed border-gray-300 pl-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><FolderOpen size={16} /> Sub-Files:</h4>
                    {file.subFiles.map((subFile) => (
                      <div key={subFile.id} className="flex justify-between items-center text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
                        <span className="flex items-center gap-1">
                          <FileType size={14} className="text-blue-500" />
                          {subFile.name} ({subFile.type})
                        </span>
                        <span className="text-gray-500">Count: {subFile.count} | Pages: {subFile.pages}</span>
                        <button onClick={() => deleteSubFile(file.id, subFile.id)} className="text-red-400 hover:text-red-600 transition p-1"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))
      )}
    </tbody>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {filteredFiles.length === 0 ? (
        <div className="col-span-full text-center py-10 text-gray-500">No files found matching your criteria.</div>
      ) : (
        filteredFiles.map(file => (
          <div key={file.id} className={`bg-white rounded-xl shadow-lg border-t-4 border-l-2 p-5 flex flex-col justify-between transition duration-300 hover:shadow-xl ${getPriorityColor(file.priority).replace('-100', '-300').replace('text-', 'border-')}`}>
            
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-900 truncate" title={file.fileName}>{file.fileName}</h3>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(file.status)}`}>{file.status}</span>
            </div>

            <p className="text-sm text-blue-600 font-semibold mb-2 flex items-center gap-1">
              <BookOpen size={16} /> {file.fileNumber}
            </p>

            <div className="space-y-1 text-sm text-gray-600 border-t pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1"><FileType size={16} /> Type:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getFileTypeColor(file.fileType)}`}>{file.fileType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1"><MapPin size={16} /> Location:</span>
                <span className="text-gray-700 font-medium">{`${file.almirah}-R${file.rack}-${file.row}${file.column}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1"><Folder size={16} /> Category:</span>
                <span className="text-gray-700">{file.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1"><Files size={16} /> Sub-Files:</span>
                <span className="text-gray-700">{file.subFiles?.length || 0}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <button onClick={() => viewDetails(file)} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Eye size={16} /> Details
              </button>
              <div className="flex space-x-2">
                <button onClick={() => openModal(file)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full bg-indigo-50"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
  
  const renderAddEditModal = () => (
    <Modal title={selectedFile ? 'Edit File Record' : 'Add New File'} show={showModal} onClose={closeModal} size="xl">
      <form onSubmit={(e) => { e.preventDefault(); handleAddEdit(); }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* File Details */}
          <div className="md:col-span-2 space-y-4 border-r pr-6">
            <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700">File Number (Required)</span>
                  <input type="text" required value={formData.fileNumber} onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., FILE-2024-001" />
                </label>
                <label className="block">
                  <span className="text-gray-700">File Name (Required)</span>
                  <input type="text" required value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Annual Budget 2024" />
                </label>
            </div>
            
            <label className="block">
                <span className="text-gray-700">Description</span>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Brief summary of the file content"></textarea>
            </label>

            <div className="grid grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-gray-700">Category</span>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                    <span className="text-gray-700">Priority</span>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="text-gray-700">Status</span>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
            </div>
            
            <h4 className="font-semibold text-gray-700 border-b pb-2 pt-4 flex items-center gap-2"><Files size={20} className="text-green-500" /> Type & Content</h4>
            <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700">File Type</span>
                  <select value={formData.fileType} onChange={(e) => setFormData({ ...formData, fileType: e.target.value, customFileType: '' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    {fileTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                {formData.fileType === 'Others' && (
                  <label className="block">
                    <span className="text-gray-700">Custom Type</span>
                    <input type="text" value={formData.customFileType} onChange={(e) => setFormData({ ...formData, customFileType: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Blue Folder" />
                  </label>
                )}
                <label className="block">
                    <span className="text-gray-700">Total Pages</span>
                    <input type="number" min="0" value={formData.pages} onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </label>
            </div>
            
            {selectedFile && (
              <label className="block">
                <span className="text-gray-700">Update/Movement Note</span>
                <input type="text" value={formData.updateNote} onChange={(e) => setFormData({ ...formData, updateNote: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Reason for change (e.g., Moved to storage)" />
              </label>
            )}
          </div>
          
          {/* Location and Tags */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2"><MapPin size={20} className="text-red-500" /> Location Details</h4>
            <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-gray-700">Almirah/Section</span>
                  <input type="text" value={formData.almirah} onChange={(e) => setFormData({ ...formData, almirah: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., A1" />
                </label>
                <label className="block">
                  <span className="text-gray-700">Rack/Drawer</span>
                  <input type="text" value={formData.rack} onChange={(e) => setFormData({ ...formData, rack: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., 2" />
                </label>
                <label className="block">
                  <span className="text-gray-700">Row (A, B, C...)</span>
                  <input type="text" maxLength="1" value={formData.row} onChange={(e) => setFormData({ ...formData, row: e.target.value.toUpperCase() })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., B" />
                </label>
                <label className="block">
                  <span className="text-gray-700">Column/Position</span>
                  <input type="text" value={formData.column} onChange={(e) => setFormData({ ...formData, column: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., 3" />
                </label>
            </div>
            
            <h4 className="font-semibold text-gray-700 border-b pb-2 pt-4 flex items-center gap-2"><Tag size={20} className="text-purple-500" /> Tags & Assignment</h4>
            <label className="block">
              <span className="text-gray-700">Assigned To (Responsible Person)</span>
              <input type="text" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., John Doe" />
            </label>
            
            <label className="block">
                <span className="text-gray-700">Tags</span>
                <div className="flex mt-1">
                    <input type="text" value={formData.newTag} onChange={(e) => setFormData({ ...formData, newTag: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag()} className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Add a new tag" />
                    <button type="button" onClick={addTag} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-r-md hover:bg-purple-700 transition">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {(formData.tags || []).map(tag => (
                      <span key={tag} className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-purple-600 hover:text-purple-900 transition"><X size={12} /></button>
                      </span>
                    ))}
                </div>
            </label>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
          <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Save size={20} />
            {selectedFile ? 'Save Changes' : 'Add File'}
          </button>
        </div>
      </form>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal title={`Details: ${selectedFile?.fileName}`} show={showDetailModal} onClose={() => setShowDetailModal(false)} size="xl">
      {selectedFile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-4 pr-4 border-r">
            
            <div className="flex justify-between items-start border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-900">{selectedFile.fileName}</h3>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(selectedFile.status)}`}>{selectedFile.status}</span>
                <span className={`text-xs mt-1 font-medium px-2 py-0.5 rounded-full ${getPriorityColor(selectedFile.priority)}`}>{selectedFile.priority} Priority</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-semibold text-gray-700">File Number:</span> <span className="text-blue-600 font-medium">{selectedFile.fileNumber}</span></p>
                <p><span className="font-semibold text-gray-700">Category:</span> {selectedFile.category}</p>
                <p><span className="font-semibold text-gray-700">File Type:</span> {selectedFile.fileType}</p>
                <p><span className="font-semibold text-gray-700">Total Pages:</span> {getTotalPages(selectedFile)}</p>
                <p><span className="font-semibold text-gray-700">Assigned To:</span> <span className="flex items-center gap-1"><User size={14} />{selectedFile.assignedTo || 'N/A'}</span></p>
                <p><span className="font-semibold text-gray-700">Date Created:</span> {selectedFile.createdDate}</p>
            </div>

            <p className="mt-4"><span className="font-semibold text-gray-700">Description:</span> {selectedFile.description || 'No description provided.'}</p>
            
            <div className="mt-4">
              <span className="font-semibold text-gray-700 flex items-center gap-1 mb-2"><Tag size={16} /> Tags:</span>
              <div className="flex flex-wrap gap-2">
                {(selectedFile.tags || []).map(tag => (
                  <span key={tag} className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                ))}
                {(selectedFile.tags?.length === 0 || !selectedFile.tags) && <span className="text-sm text-gray-500">No tags.</span>}
              </div>
            </div>

            {/* Sub-Files Section */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-3"><FolderOpen size={20} className="text-green-500" /> Sub-Files ({selectedFile.subFiles?.length || 0})</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {(selectedFile.subFiles || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No sub-files added yet.</p>
                ) : (
                  (selectedFile.subFiles || []).map((sf) => (
                    <div key={sf.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{sf.name}</span>
                      <span className="text-gray-600">{sf.type} (x{sf.count})</span>
                      <span className="text-gray-600">{sf.pages} Pages</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Location & History Column */}
          <div className="lg:col-span-1 space-y-4">
            
            <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-2"><MapPin size={20} className="text-red-500" /> Current Location</h4>
            <div className="bg-red-50 p-4 rounded-lg shadow-inner">
              <p className="text-xl font-bold text-red-800">{`${selectedFile.almirah}-R${selectedFile.rack}-${selectedFile.row}${selectedFile.column}`}</p>
              <p className="text-sm text-red-700 mt-1">Almirah: {selectedFile.almirah} | Rack: {selectedFile.rack} | Pos: {selectedFile.row}{selectedFile.column}</p>
            </div>
            <p className="text-xs text-gray-500">Last Updated: {selectedFile.lastUpdated}</p>

            <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 pt-4"><Clock size={20} className="text-amber-500" /> Movement History</h4>
            <div className="max-h-60 overflow-y-auto space-y-3">
                {(selectedFile.movements || []).slice().reverse().map((m, index) => (
                    <div key={index} className="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-gray-200">
                        <span className="absolute left-[-5px] top-0 p-1 rounded-full bg-white border-2 border-amber-400 text-amber-500"><MapPin size={12} /></span>
                        <p className="text-sm font-medium text-gray-800">Moved to {m.to}</p>
                        <p className="text-xs text-gray-600">from {m.from} by {m.movedBy}</p>
                        <p className="text-xs text-gray-500">{m.date}</p>
                        <p className="text-xs italic text-gray-700 mt-0.5">Reason: {m.reason}</p>
                    </div>
                ))}
                {(selectedFile.movements || []).length === 0 && <p className="text-sm text-gray-500">No movement history.</p>}
            </div>

            <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 pt-4"><AlertCircle size={20} className="text-indigo-500" /> Updates/Notes</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {(selectedFile.updates || []).slice().reverse().map((u, index) => (
                    <div key={index} className="p-2 bg-indigo-50 rounded-lg">
                        <p className="text-gray-800">{u.note}</p>
                        <p className="text-xs text-gray-600 mt-0.5">by {u.user} on {u.date}</p>
                    </div>
                ))}
                {(selectedFile.updates || []).length === 0 && <p className="text-sm text-gray-500">No updates/notes.</p>}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
              <button onClick={() => generateQR(selectedFile)} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition flex items-center gap-2"><QrCode size={18} /> QR Code</button>
              <button onClick={() => openModal(selectedFile)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"><Edit2 size={18} /> Edit Record</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );

  const renderSubFileModal = () => (
    <Modal title={`Add Sub-File to ${selectedFile?.fileNumber}`} show={showSubFileModal} onClose={() => setShowSubFileModal(false)} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); addSubFile(); }}>
        <div className="space-y-4">
          
          <label className="block">
            <span className="text-gray-700">Sub-File Name (Required)</span>
            <input type="text" required value={subFileForm.name} onChange={(e) => setSubFileForm({ ...subFileForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Annual Performance Review" />
          </label>
          
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-gray-700">Type</span>
              <select value={subFileForm.type} onChange={(e) => setSubFileForm({ ...subFileForm, type: e.target.value, customType: '' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                {fileTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            {subFileForm.type === 'Others' && (
              <label className="block">
                <span className="text-gray-700">Custom Type</span>
                <input type="text" value={subFileForm.customType} onChange={(e) => setSubFileForm({ ...subFileForm, customType: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Small Box" />
              </label>
            )}
            <label className="block">
              <span className="text-gray-700">Count</span>
              <input type="number" min="1" value={subFileForm.count} onChange={(e) => setSubFileForm({ ...subFileForm, count: parseInt(e.target.value) || 1 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-gray-700">Pages in Sub-File</span>
              <input type="number" min="0" value={subFileForm.pages} onChange={(e) => setSubFileForm({ ...subFileForm, pages: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </label>
          </div>

        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
          <button type="button" onClick={() => setShowSubFileModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2">
            <Plus size={20} />
            Add Sub-File
          </button>
        </div>
      </form>
    </Modal>
  );

  const renderMovementModal = () => (
    <Modal title={`Record Movement for ${selectedFile?.fileNumber}`} show={showMovementModal} onClose={() => setShowMovementModal(false)} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); addMovement(); }}>
        <div className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">From Location (Current)</span>
              <input type="text" readOnly value={movementForm.fromLocation} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 cursor-not-allowed" />
            </label>
            <label className="block">
              <span className="text-gray-700">To Location (Required) - Format: Almirah-Rack-RowCol</span>
              <input type="text" required value={movementForm.toLocation} onChange={(e) => setMovementForm({ ...movementForm, toLocation: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="e.g., B2-R5-A10" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">Moved By (Required)</span>
              <input type="text" required value={movementForm.movedBy} onChange={(e) => setMovementForm({ ...movementForm, movedBy: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="Name of person" />
            </label>
            <label className="block">
              <span className="text-gray-700">Reason for Movement</span>
              <input type="text" value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="e.g., Sent for Audit" />
            </label>
          </div>
          <p className="text-sm text-orange-600 flex items-center gap-1 mt-4"><AlertCircle size={16} /> Note: This action will set the file status to **'In Transit'**.</p>
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
          <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
            <Clock size={20} />
            Record Movement
          </button>
        </div>
      </form>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal title="System Settings" show={showSettingsModal} onClose={() => setShowSettingsModal(false)} size="md">
      <h4 className="font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2"><Columns size={20} className="text-indigo-500" /> Automatic File Numbering</h4>
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input type="checkbox" checked={autoNumberSettings.enabled} onChange={(e) => setAutoNumberSettings({ ...autoNumberSettings, enabled: e.target.checked })} className="form-checkbox h-5 w-5 text-blue-600 rounded" />
          <span className="text-gray-700 font-medium">Enable Auto Numbering</span>
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-gray-700">Prefix</span>
            <input type="text" value={autoNumberSettings.prefix} onChange={(e) => setAutoNumberSettings({ ...autoNumberSettings, prefix: e.target.value.toUpperCase() })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., FILE" />
          </label>
          <label className="block">
            <span className="text-gray-700">Counter Digits (e.g., 3 for 001)</span>
            <input type="number" min="1" max="5" value={autoNumberSettings.counter} onChange={(e) => setAutoNumberSettings({ ...autoNumberSettings, counter: parseInt(e.target.value) || 3 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </label>
        </div>

        <label className="flex items-center space-x-3">
          <input type="checkbox" checked={autoNumberSettings.year} onChange={(e) => setAutoNumberSettings({ ...autoNumberSettings, year: e.target.checked })} className="form-checkbox h-5 w-5 text-blue-600 rounded" />
          <span className="text-gray-700 font-medium">Include Current Year (e.g., FILE-2024-001)</span>
        </label>
        
        <p className="text-sm text-gray-500 pt-2">Example: **{autoNumberSettings.prefix}-{autoNumberSettings.year ? new Date().getFullYear() + '-' : ''}XXX**</p>
      </div>
      
      <div className="mt-6 pt-4 border-t flex justify-end">
        <button onClick={() => setShowSettingsModal(false)} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <CheckCircle size={20} /> Close & Save
        </button>
      </div>
    </Modal>
  );

  const renderQRModal = () => (
    <Modal title={`QR Code for ${selectedFile?.fileNumber}`} show={showQRModal} onClose={() => setShowQRModal(false)} size="sm">
      <div className="flex flex-col items-center justify-center p-4">
        {/* Placeholder for QR Code generation (In a real app, you'd use a library like 'qrcode.react') */}
        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg border-4 border-dashed border-gray-300">
          <QrCode size={40} />
        </div>
        <p className="mt-4 text-center text-lg font-medium text-gray-700">{selectedFile?.fileName}</p>
        <p className="text-center text-sm text-blue-600">{selectedFile?.fileNumber}</p>

        <div className="mt-6 flex space-x-3">
          <button onClick={() => alert('Printing is not implemented yet.')} className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition flex items-center gap-2"><Printer size={18} /> Print</button>
          <button onClick={() => alert('Download is not implemented yet.')} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"><Download size={18} /> Download</button>
        </div>
        <p className="text-xs text-gray-500 mt-4 italic">The QR code would link to a public view or search for this file number.</p>
      </div>
    </Modal>
  );

  // --- Main Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud size={64} className="mx-auto text-blue-600 animate-bounce mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading data from Google Drive...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            
            {/* Title and Logo */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <FileText className="text-white" size={32} />
                </div>
                Fileon - File Organizer
              </h1>
              <p className="text-sm text-gray-500 mt-1 ml-12">Total Records: {files.length} | Last Sync: {lastSyncTime || 'N/A'} {syncing && <RefreshCw size={14} className="inline ml-2 animate-spin text-blue-500" />}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => saveToDrive(false)} disabled={syncing} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:bg-indigo-400">
                <Save size={20} />
                {syncing ? 'Saving...' : 'Manual Save'}
              </button>
              <button onClick={() => openModal()} className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md">
                <Plus size={20} />
                Add New File
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5 mb-8">
          <StatCard icon={Files} title="Total Files" value={stats.total} colorClass="border-blue-400 text-blue-600" />
          <StatCard icon={CheckCircle} title="Active" value={stats.active} colorClass="border-green-400 text-green-600" />
          <StatCard icon={Archive} title="Archived" value={stats.archived} colorClass="border-gray-400 text-gray-600" />
          <StatCard icon={AlertCircle} title="Urgent" value={stats.urgent} colorClass="border-red-400 text-red-600" />
          <StatCard icon={Folder} title="Categories" value={stats.categories} colorClass="border-yellow-400 text-yellow-600" />
          <StatCard icon={Files} title="Sub-Files" value={stats.subFiles} colorClass="border-cyan-400 text-cyan-600" />
          <StatCard icon={BookOpen} title="Registers" value={stats.registers} colorClass="border-emerald-400 text-emerald-600" />
          <StatCard icon={FileText} title="Total Pages" value={stats.totalPages} colorClass="border-purple-400 text-purple-600" />
        </div>

        {/* Search, Filter & View Controls */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full lg:w-96" ref={searchRef}>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Search by File Name, Number, Tag..."
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              
              {/* Search Suggestions */}
              {searchTerm.length > 1 && showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion) => (
                    <div 
                      key={suggestion} 
                      className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-800 text-sm"
                      onClick={() => { setSearchTerm(suggestion); setShowSuggestions(false); }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode & Export */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                  title="Table View"
                >
                  <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('card')} 
                  className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                  title="Card View"
                >
                  <Columns size={20} />
                </button>
              </div>
              
              <div className="relative group">
                <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                  <FileDown size={20} /> Export
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-20 hidden group-hover:block">
                  <button onClick={exportToCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Download size={16} /> Export CSV</button>
                  <button onClick={exportToJSON} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Download size={16} /> Export JSON</button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {renderFilterControls()}
          </div>
        </div>

        {/* File List / Table */}
        <div className="shadow-lg rounded-xl overflow-hidden ring-1 ring-black ring-opacity-5">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                {renderTableBody()}
              </table>
            </div>
          ) : (
            renderCardView()
          )}
        </div>
        
      </div>

      {/* Modals */}
      {renderAddEditModal()}
      {renderDetailModal()}
      {renderSubFileModal()}
      {renderMovementModal()}
      {renderSettingsModal()}
      {renderQRModal()}

    </div>
  );
};

export default FileOrganizerSystem;
