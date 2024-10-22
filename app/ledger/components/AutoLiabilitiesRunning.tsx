// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< Updated upstream
import { AlertCircle } from 'lucide-react';
=======
import { AlertCircle, PlayCircle, StopCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
>>>>>>> Stashed changes

export function AutoLiabilitiesRunning({ onComplete }) {
    const [progress, setProgress] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [currentCompany, setCurrentCompany] = useState('');

    useEffect(() => {
        const interval = setInterval(fetchProgress, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchProgress = async () => {
        try {
            const response = await fetch('/api/ledgers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'progress' })
            });
            const data = await response.json();
            setProgress(data.progress);
            setIsRunning(data.isRunning);
            setCurrentCompany(data.currentCompany);
            setLogs(data.logs || []); // Ensure logs is always an array
            if (!data.isRunning && data.progress === 100) {
                onComplete();
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    };

<<<<<<< Updated upstream
    const handleStop = async () => {
        try {
            const response = await fetch('/api/ledgers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            if (response.ok) {
                setIsRunning(false);
            } else {
                throw new Error('Failed to stop Auto Liabilities extraction');
            }
        } catch (error) {
            console.error('Error stopping Auto Liabilities extraction:', error);
            alert('Failed to stop Auto Liabilities extraction. Please try again.');
        }
    };
=======
  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'progress' })
      });
      
      const data = await response.json();
      setProgress(data.progress);
      setIsRunning(data.status === 'running');
      setStatus(data.status);
      setCurrentCompany(data.currentCompany);
      setLogs(data.logs || []);

      if (data.status !== 'running' && data.progress === 100) {
        onComplete();
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      if (response.ok) {
        setIsRunning(false);
        setStatus('stopped');
        onComplete();
      }
    } catch (error) {
      console.error('Error stopping extraction:', error);
      alert('Failed to stop extraction. Please try again.');
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resume',
          company: currentCompany,
          lastProgress: progress
        })
      });
  
      if (response.ok) {
        setIsRunning(true);
        setStatus('running');
        await fetchProgress();
      } else {
        throw new Error('Failed to resume extraction');
      }
    } catch (error) {
      console.error('Error resuming extraction:', error);
      alert('Failed to resume extraction. Please try again.');
    }
  };
  
>>>>>>> Stashed changes

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Auto Liabilities Extraction in Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between items-center">
                    <p className="text-lg font-medium">{progress}% complete</p>
<<<<<<< Updated upstream
                    <Button onClick={handleStop} disabled={!isRunning} variant="destructive" size="lg">
                        Stop Extraction
                    </Button>
=======
                    <div className="space-x-2">
                    {status === 'running' ? (
                            <Button 
                                onClick={handleStop} 
                                variant="destructive" 
                                size="lg"
                                className="flex items-center gap-2"
                            >
                                <StopCircle className="w-4 h-4" />
                                Stop Extraction
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleResume}
                                variant="default"
                                size="lg"
                                className="flex items-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Resume Extraction
                            </Button>
                        )}
                    </div>
>>>>>>> Stashed changes
                </div>
                {isRunning && currentCompany && (
                    <div className="flex items-center p-4 text-sm text-blue-800 border border-blue-300 rounded-lg bg-blue-50" role="alert">
                        <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                        <span className="sr-only">Info</span>
                        <div>
                            <span className="font-medium">Currently processing:</span> {currentCompany}
                        </div>
                    </div>
                )}
                <div className="h-[300px] overflow-y-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell>{log.company}</TableCell>
                                    <TableCell>{log.status}</TableCell>
                                    <TableCell>{log.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}