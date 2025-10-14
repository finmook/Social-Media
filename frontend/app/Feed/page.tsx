'use client'
import InputField from '@/components/InputField';
import NavBar from '@/components/NavBar'
import { Stack } from '@mui/material';
export default function Feed(){

    return (<div className='flex flex-col items-center w-12/12'>
        <Stack spacing={5} sx={{width:"100%"}}>
        <NavBar />
        <div className="flex justify-center">
         <InputField />
        </div>
       
        </Stack>
        
    </div>);


}