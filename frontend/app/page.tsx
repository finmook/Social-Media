'use client';
import { useEffect } from 'react';
import Link from 'next/link'
import { supabase } from '@/lib/supabase';
import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

export default function Home() {
  
  return <main className='min-h-dvh'>
    <div className="flex flex-col justify-center items-center h-dvh w-12/12">
    <Paper sx={{ width: { xs: "100%", sm: 600 }, py: 3 ,px:3,height:{sm: 350}}} elevation={3} className='flex flex-col justify-center items-center'>
      <div className="w-12/12 h-4/12 flex justify-center items-center my-8">
        <h1 className="font-bold text-xl">
          Welcome to my Social Media website!
        </h1>
      </div>
      <div className='w-5/12 h-10/12' >
        <Stack direction="column" spacing={2}>
          <Button variant="outlined" href="/Login">Sign In</Button>
          <Button variant="contained" href="/Register" color="primary">Sign Up</Button>
        </Stack>
      </div>
    </Paper>


  </div>;
  </main>
  
  
}
