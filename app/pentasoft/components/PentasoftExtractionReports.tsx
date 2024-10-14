// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Download, MoreHorizontal, RefreshCw, Upload } from "lucide-react";
import * as ExcelJS from 'exceljs';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const STORAGE_BUCKET = 'pentasoft-reports';

interface FilePreview {
    fileName: string;
    companyName: string;
    reportType: string;
    extractionDate: string;
    fullPath: string;
}

interface ExtractionFile {
    name: string;
    fullPath: string;
}

interface ExtractionRecord {
    id: number;
    company_name: string;
    extraction_date: string;
    files: ExtractionFile[];
}

export function PentasoftExtractionReports() {
    const [reports, setReports] = useState<ExtractionRecord[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<ExtractionRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [visibleColumns, setVisibleColumns] = useState({
        company_name: true,
        extraction_date: true,
        paye: true,
        nssf: true,
        nhif: true,
        nita: true,
        house_levy: true,
    });

    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [filesPreviews, setFilesPreviews] = useState<FilePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data: reportsData, error } = await supabase
                .from('pentasoft_extractions')
                .select('*'); // Adjust the select statement based on the fields you need
    
            if (error) throw error;
    
            // Set the fetched reports to state
            setReports(reportsData);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };
    

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('asc');
        }
    };

    const sortedReports = [...reports].sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredReports = sortedReports.filter(report =>
        report.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Pentasoft Extraction Reports');

        const headers = ['Company Name', 'Extraction Date', 'PAYE', 'NSSF', 'NHIF', 'NITA', 'Housing Levy'];
        worksheet.addRow(headers);

        filteredReports.forEach((report) => {
            const row = [
                report.company_name,
                new Date(report.extraction_date).toLocaleString(),
                findFile(report.files, 'PAYE')?.name || 'Missing',
                findFile(report.files, 'NSSF')?.name || 'Missing',
                findFile(report.files, 'NHIF')?.name || 'Missing',
                findFile(report.files, 'NITA')?.name || 'Missing',
                findFile(report.files, 'HOUSE LEVY')?.name || 'Missing',
            ];
            worksheet.addRow(row);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pentasoft_extraction_reports.xlsx';
        link.click();
    };

    const findFile = (files: ExtractionFile[], type: string) => {
        return files.find(file => file.name.includes(type));
    };

    const renderFileButton = (file: ExtractionFile | undefined) => {
        if (!file) return <span className="text-red-500 font-bold">Missing</span>;
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.fullPath, '_blank')}
            >
                <Download className="mr-1 h-3 w-3" />
                Download
            </Button>
        );
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const previews: FilePreview[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name;

            // Regex to extract company name, report type, and date from filename
            const regex = /^(.*?)-\s*(.*?)\s+(\d{2}\.\d{2}\.\d{4})(\.\w+)?$/;
            const match = fileName.match(regex);

            if (match) {
                const companyName = match[1].trim(); // Extract company name
                const reportType = match[2].trim();  // Extract report type
                const extractionDate = match[3].trim(); // Extract date (dd.mm.yyyy)

                previews.push({
                    fileName,
                    companyName,
                    reportType,
                    extractionDate,
                    fullPath: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${companyName}/${fileName}`
                });
            } else {
                console.error(`Filename "${fileName}" does not match the expected format.`);
            }
        }

        setFilesPreviews(previews);
        setIsPreviewOpen(true);
    };


    const handleFileUpload = async () => {
        setIsUploading(true);
    
        try {
            // Create a map to store files by company
            const companyFilesMap = {};
    
            // Gather all the files per company
            for (const preview of filesPreviews) {
                const file = Array.from(fileInputRef.current!.files!).find(f => f.name === preview.fileName);
                if (!file) continue; // Skip if the file is not found
    
                if (!companyFilesMap[preview.companyName]) {
                    companyFilesMap[preview.companyName] = [];
                }
    
                // Check if the specific file already exists in the database
                const { data: existingFiles, error: fetchError } = await supabase
                    .from('pentasoft_extractions')
                    .select('*')
                    .eq('company_name', preview.companyName);
    
                if (fetchError) throw fetchError;
    
                const fileExists = existingFiles?.some(existingEntry => 
                    existingEntry.files.some(fileObj => fileObj.name === preview.reportType)
                );
    
                // If the file does not exist, prepare to upload it
                if (!fileExists) {
                    // Upload file to Supabase Storage
                    const { data, error } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(`${preview.companyName}/${preview.fileName}`, file, {
                            contentType: file.type,
                        });
    
                    if (error) throw error;
    
                    // Add file details to the company's files array
                    companyFilesMap[preview.companyName].push({
                        name: preview.reportType,
                        path: data.path,
                        fullPath: preview.fullPath,
                        extraction_date: preview.extractionDate // Include extraction date
                    });
                } else {
                    console.log(`File already exists: ${preview.fileName}. Skipping upload.`);
                }
            }
    
            // Upload files for each company
            const uploadPromises = Object.entries(companyFilesMap).map(async ([companyName, files]) => {
                // Check if this company already exists in the database
                const { data: existingFiles, error: fetchError } = await supabase
                    .from('pentasoft_extractions')
                    .select('*')
                    .eq('company_name', companyName);
    
                if (fetchError) throw fetchError;
    
                if (existingFiles && existingFiles.length > 0) {
                    // If the company already exists, update its files
                    const existingFileEntry = existingFiles[0]; // Assume only one entry exists per company
    
                    const updatedFiles = [...existingFileEntry.files, ...files]; // Combine existing files with new ones
    
                    // Update the existing entry in Supabase table
                    const { error: updateError } = await supabase
                        .from('pentasoft_extractions')
                        .update({
                            files: updatedFiles
                        })
                        .eq('id', existingFileEntry.id); // Update the correct entry
    
                    if (updateError) throw updateError;
                } else {
                    // If no existing entry for this company, create a new one
                    const { error: insertError } = await supabase
                        .from('pentasoft_extractions')
                        .insert({
                            company_name: companyName,
                            files: files // Insert all new files for this company
                        });
    
                    if (insertError) throw insertError;
                }
            });
    
            // Execute all upload promises concurrently
            await Promise.all(uploadPromises);
    
            // Refresh the reports after successful uploads
            await fetchReports();
            setIsPreviewOpen(false);
            setFilesPreviews([]);
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            setIsUploading(false);
        }
    };
    

    return (
        <Tabs defaultValue="summary">
            <TabsList>
                <TabsTrigger value="summary">Summary View</TabsTrigger>
                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
                <div className="flex justify-between mb-4">
                    <Input
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <div className="flex gap-2">
                        <Button onClick={exportToExcel} size="sm" className="px-2 py-1">
                            <Download className="mr-1 h-4 w-4" />
                            Export to Excel
                        </Button>
                        <Button onClick={fetchReports} size="sm" className="px-2 py-1">
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="px-2 py-1">
                            <Upload className="mr-1 h-4 w-4" />
                            Select Files
                        </Button>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            multiple
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto" size="sm" className="px-2 py-1">
                                    Columns <MoreHorizontal className="ml-1 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Object.keys(visibleColumns).map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column}
                                        className="capitalize text-sm"
                                        checked={visibleColumns[column]}
                                        onCheckedChange={(value) =>
                                            setVisibleColumns((prev) => ({ ...prev, [column]: value }))
                                        }
                                    >
                                        {column.replace('_', ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="border rounded-md mb-2">
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {[
                                        { key: 'index', label: 'Index', alwaysVisible: true },
                                        { key: 'company_name', label: 'Company Name' },
                                        { key: 'extraction_date', label: 'Extraction Date' },
                                        { key: 'paye', label: 'PAYE' },
                                        { key: 'nssf', label: 'NSSF' },
                                        { key: 'nhif', label: 'NHIF' },
                                        { key: 'nita', label: 'NITA' },
                                        { key: 'house_levy', label: 'Housing Levy' },
                                    ].map(({ key, label, alwaysVisible }) => (
                                        (alwaysVisible || visibleColumns[key]) && (
                                            <TableHead key={key}>
                                                <div className="flex items-center">
                                                    {label}
                                                    {!['index', 'paye', 'nssf', 'nhif', 'nita', 'house_levy'].includes(key) && (
                                                        <ArrowUpDown
                                                            className="h-4 w-4 cursor-pointer"
                                                            onClick={() => handleSort(key)}
                                                        />
                                                    )}
                                                </div>
                                            </TableHead>
                                        )
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map((report, index) => (
                                    <TableRow key={report.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                        <TableCell>{index + 1}</TableCell>
                                        {visibleColumns.company_name && <TableCell>{report.company_name}</TableCell>}
                                        {visibleColumns.extraction_date && <TableCell>{new Date(report.extraction_date).toLocaleString()}</TableCell>}
                                        {visibleColumns.paye && <TableCell>{renderFileButton(findFile(report.files, 'PAYE'))}</TableCell>}
                                        {visibleColumns.nssf && <TableCell>{renderFileButton(findFile(report.files, 'NSSF'))}</TableCell>}
                                        {visibleColumns.nhif && <TableCell>{renderFileButton(findFile(report.files, 'NHIF'))}</TableCell>}
                                        {visibleColumns.nita && <TableCell>{renderFileButton(findFile(report.files, 'NITA'))}</TableCell>}
                                        {visibleColumns.house_levy && <TableCell>{renderFileButton(findFile(report.files, 'HOUSE LEVY'))}</TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </TabsContent>
            <TabsContent value="detailed">
                <div className="flex space-x-8 mb-4">
                    <ScrollArea className="h-[600px] w-85 rounded-md border">
                        {reports.map((report, index) => (
                            <React.Fragment key={report.id}>
                                <div
                                    className={`p-2 cursor-pointer transition-colors duration-200 text-xs uppercase ${selectedCompany?.id === report.id
                                        ? 'bg-blue-500 text-white font-bold'
                                        : 'hover:bg-blue-100'
                                        }`}
                                    onClick={() => setSelectedCompany(report)}
                                >
                                    {report.company_name}
                                </div>
                                {index < reports.length - 1 && (
                                    <div className="border-b border-gray-200"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </ScrollArea>
                    <div className="flex-1">
                        {selectedCompany && (
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                    <CardTitle className="text-xl">{selectedCompany.company_name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ScrollArea className="h-[600px]">
                                        <div className="space-y-4">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Extraction Date</TableHead>
                                                        <TableHead className="text-xs text-center">PAYE</TableHead>
                                                        <TableHead className="text-xs text-center">NSSF</TableHead>
                                                        <TableHead className="text-xs text-center">NHIF</TableHead>
                                                        <TableHead className="text-xs text-center">NITA</TableHead>
                                                        <TableHead className="text-xs text-center">Housing Levy</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="text-xs p-1 whitespace-nowrap">
                                                            {new Date(selectedCompany.extraction_date).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-xs p-1 text-center">{renderFileButton(findFile(selectedCompany.files, 'PAYE'))}</TableCell>
                                                        <TableCell className="text-xs p-1 text-center">{renderFileButton(findFile(selectedCompany.files, 'NSSF'))}</TableCell>
                                                        <TableCell className="text-xs p-1 text-center">{renderFileButton(findFile(selectedCompany.files, 'NHIF'))}</TableCell>
                                                        <TableCell className="text-xs p-1 text-center">{renderFileButton(findFile(selectedCompany.files, 'NITA'))}</TableCell>
                                                        <TableCell className="text-xs p-1 text-center">{renderFileButton(findFile(selectedCompany.files, 'HOUSE LEVY'))}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </TabsContent>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Preview of Files to Upload</DialogTitle>
                    </DialogHeader>

                    {/* Scrollable content */}
                    <ScrollArea className="h-[400px] mt-4 text-[9px]">
                        <p className="mb-2">Storage Bucket: {STORAGE_BUCKET}</p>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Report Type</TableHead>
                                    <TableHead>Extraction Date</TableHead>
                                    <TableHead>Full Path</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filesPreviews.map((preview, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{preview.fileName}</TableCell>
                                        <TableCell>{preview.companyName}</TableCell>
                                        <TableCell>{preview.reportType}</TableCell>
                                        <TableCell>{preview.extractionDate}</TableCell>
                                        <TableCell className="truncate max-w-xs" title={preview.fullPath}>
                                            {preview.fullPath}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleFileUpload} disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}