import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiMail, 
  FiEye, 
  FiSearch, 
  FiFilter,
  FiRefreshCw,
  FiFileText
} from 'react-icons/fi';
import { invoiceAPI, type Invoice, type InvoiceStatus } from '../../services/invoiceAPI';
import InvoiceDetailModal from './InvoiceDetailModal';
import SendEmailModal from './SendEmailModal';

interface InvoiceManagementProps {
  // Props từ parent component nếu cần
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = () => {
  
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  // Load invoices on component mount và khi filter thay đổi
  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getAllInvoices(
        statusFilter || undefined,
        undefined,
        undefined
      );
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.orderId.toString().includes(searchLower) ||
      (invoice.customerName && invoice.customerName.toLowerCase().includes(searchLower)) ||
      (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(searchLower))
    );
  });

  // Handle download PDF
  const handleDownloadPdf = async (invoice: Invoice) => {
    if (!invoice.pdfFileName) {
      // TODO: Show error notification
      return;
    }

    try {
      setDownloadingId(invoice.id);
      const blob = await invoiceAPI.downloadInvoicePdf(invoice.id);
      const fileName = `HoaDon_${invoice.invoiceNumber}.pdf`;
      invoiceAPI.downloadFileFromBlob(blob, fileName);
      
      // TODO: Show success notification
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // TODO: Show error notification
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle send email
  const handleSendEmail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowEmailModal(true);
  };

  // Handle email sent successfully
  const onEmailSent = () => {
    setShowEmailModal(false);
    setSelectedInvoice(null);
    // Reload invoices to get updated status
    loadInvoices();
  };

  // Handle view details
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  // Get status badge className
  const getStatusBadgeClass = (status: InvoiceStatus) => {
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoiceAPI.getStatusColor(status)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <FiRefreshCw className="animate-spin text-blue-500" />
          <span className="text-gray-600">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Invoice Management
          </h2>
          <p className="text-gray-600">
            View and manage all invoices for completed deliveries
          </p>
        </div>
        <button
          onClick={loadInvoices}
          className="mt-4 sm:mt-0 flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number, order ID, or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-4">
        {}
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issued Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    No invoices found
                  </p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      #{invoice.orderId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.customerName || '-'}
                    </div>
                    {invoice.customerEmail && (
                      <div className="text-sm text-gray-500">
                        {invoice.customerEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoiceAPI.formatCurrency(invoice.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadgeClass(invoice.invoiceStatus)}>
                      {invoice.invoiceStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoiceAPI.formatDate(invoice.issuedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* View Details */}
                      <button
                        onClick={() => handleViewDetails(invoice)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>

                      {/* Download PDF */}
                      {invoice.pdfFileName ? (
                        <button
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={downloadingId === invoice.id}
                          className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === invoice.id ? (
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiDownload className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400 p-1">
                          <FiDownload className="w-4 h-4" />
                        </span>
                      )}

                      {/* Send Email */}
                      {invoice.invoiceStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => handleSendEmail(invoice)}
                          disabled={sendingEmailId === invoice.id}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded disabled:opacity-50"
                          title="Send Email"
                        >
                          {sendingEmailId === invoice.id ? (
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiMail className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showDetailModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {showEmailModal && selectedInvoice && (
        <SendEmailModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedInvoice(null);
          }}
          onEmailSent={onEmailSent}
          setSendingId={setSendingEmailId}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;
