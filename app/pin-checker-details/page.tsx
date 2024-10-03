// pages/pin-checker-details.tsx
// @ts-nocheck
"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PinCheckerDetailsRunning } from '@/components/PinCheckerDetailsRunning'
import { PinCheckerDetailsReports } from '@/components/PinCheckerDetailsReports'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { supabase } from '@/lib/supabase'

export default function PinCheckerDetails() {
    const [isChecking, setIsChecking] = useState(false)
    const [activeTab, setActiveTab] = useState("reports")
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState("Not Started")
    const [companies, setCompanies] = useState([])
    const [selectedCompanies, setSelectedCompanies] = useState([])
    const [runOption, setRunOption] = useState('all')

    useEffect(() => {
        fetchCompanies()
    }, [])

    useEffect(() => {
        if (isChecking) {
            const interval = setInterval(checkProgress, 5000)
            return () => clearInterval(interval)
        }
    }, [isChecking])

    const fetchCompanies = async () => {
        const { data, error } = await supabase
            .from('PasswordChecker')
            .select('id, company_name, kra_pin')
            .order('id', { ascending: true })

        if (error) {
            console.error('Error fetching companies:', error)
        } else {
            setCompanies(data || [])
        }
    }

    const checkProgress = async () => {
        try {
            const response = await fetch('/api/pin-checker-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "getProgress" })
            });
            if (!response.ok) throw new Error('Failed to fetch progress');
            const data = await response.json();
            setProgress(data.progress);
            setStatus(data.status);
            setIsChecking(data.status === "Running");
            if (data.status === "Running") {
                setActiveTab("running");
            } else if (data.status === "Completed") {
                setActiveTab("reports");
            }
        } catch (error) {
            console.error('Error checking progress:', error);
        }
    };

    const handleStartCheck = async () => {
        if (isChecking) {
            alert('An automation is already running. Please wait for it to complete or stop it before starting a new one.');
            return;
        }

        try {
            const response = await fetch('/api/pin-checker-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: "start",
                    runOption,
                    selectedIds: runOption === 'selected' ? selectedCompanies : []
                })
            })

            if (!response.ok) throw new Error('API request failed')

            const data = await response.json()
            console.log('PIN Checker Details started:', data)
            setIsChecking(true)
            setStatus("Running")
            setActiveTab("running")
        } catch (error) {
            console.error('Error starting PIN Checker Details:', error)
            alert('Failed to start PIN Checker Details. Please try again.')
        }
    }

    const handleStopCheck = async () => {
        if (!isChecking) {
            alert('There is no automation currently running.');
            return;
        }

        try {
            const response = await fetch('/api/pin-checker-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "stop" })
            })

            if (!response.ok) throw new Error('Failed to stop automation')

            const data = await response.json()
            console.log('Automation stopped:', data)
            setIsChecking(false)
            setStatus("Stopped")
            alert('Automation stopped successfully.')
        } catch (error) {
            console.error('Error stopping automation:', error)
            alert('Failed to stop automation. Please try again.')
        }
    }

    const handleCheckboxChange = (id: string) => {
        setSelectedCompanies((prev: string[] | never[]) =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <div className="p-4 w-full">
            <Card>
                <CardHeader>
                    <CardTitle>PIN Checker Details (Obligations)</CardTitle>
                    <CardDescription>Extract obligation details for multiple companies</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="start">Start</TabsTrigger>
                            <TabsTrigger value="running">Running</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>
                        <TabsContent value="start">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Start PIN Checker Details</CardTitle>
                                    <CardDescription>Begin the obligation details extraction process for companies.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <label className="block mb-2">Run option:</label>
                                        <Select value={runOption} onValueChange={(value) => setRunOption(value)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select run option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Companies</SelectItem>
                                                <SelectItem value="selected">Selected Companies</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {runOption === 'selected' && (
                                        <div className="flex">
                                            <motion.div
                                                className="pr-2"
                                                initial={{ width: "100%" }}
                                                animate={{ width: selectedCompanies.length > 0 ? "50%" : "100%" }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="max-h-[580px] overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[50px] sticky top-0 bg-white">Select</TableHead>
                                                                <TableHead className="sticky top-0 bg-white">#</TableHead>
                                                                <TableHead className="sticky top-0 bg-white">Company Name</TableHead>
                                                                <TableHead className="sticky top-0 bg-white">KRA PIN</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {companies.map((company, index) => (
                                                                <TableRow key={company.id}>
                                                                    <TableCell>
                                                                        <Checkbox
                                                                            checked={selectedCompanies.includes(company.id)}
                                                                            onCheckedChange={() => handleCheckboxChange(company.id)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="text-center">{index + 1}</TableCell>
                                                                    <TableCell>{company.company_name}</TableCell>
                                                                    <TableCell>{company.kra_pin}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </motion.div>
                                            {selectedCompanies.length > 0 && (
                                                <motion.div
                                                    className="pl-2"
                                                    initial={{ width: "0%", opacity: 0 }}
                                                    animate={{ width: "50%", opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-semibold mb-2">Selected Companies</h3>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>#</TableHead>
                                                                    <TableHead>Company Name</TableHead>
                                                                    <TableHead>KRA PIN</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {companies.filter(c => selectedCompanies.includes(c.id)).map((company, index) => (
                                                                    <TableRow key={company.id} className="bg-blue-100">
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>{company.company_name}</TableCell>
                                                                        <TableCell>{company.kra_pin}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button onClick={handleStartCheck} disabled={isChecking || (runOption === 'selected' && selectedCompanies.length === 0)}>
                                                            {isChecking ? 'Running...' : 'Start PIN Checker Details'}
                                                        </Button>
                                                        <Button onClick={handleStopCheck} disabled={!isChecking} variant="destructive" className="ml-2">
                                                            Stop PIN Checker Details
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                {runOption !== 'selected' && (
                                    <CardFooter>
                                        <Button onClick={handleStartCheck} disabled={isChecking || (runOption === 'selected' && selectedCompanies.length === 0)}>
                                            {isChecking ? 'Running...' : 'Start PIN Checker Details'}
                                        </Button>
                                        <Button onClick={handleStopCheck} disabled={!isChecking} variant="destructive" className="ml-2">
                                            Stop PIN Checker Details
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </TabsContent>
                        <TabsContent value="running">
                            <PinCheckerDetailsRunning 
                                onComplete={() => {
                                    setActiveTab("reports");
                                    setIsChecking(false);
                                    setStatus("Completed");
                                }} 
                                progress={progress}
                                status={status}
                            />
                            <Button onClick={handleStopCheck} disabled={!isChecking} variant="destructive" className="mt-4">
                                Stop PIN Checker Details
                            </Button>
                        </TabsContent>
                        <TabsContent value="reports">
                            <PinCheckerDetailsReports />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}