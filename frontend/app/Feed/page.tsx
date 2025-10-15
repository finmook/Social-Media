'use client'
import InputField from '@/components/InputField';
import NavBar from '@/components/NavBar'
import Button from '@mui/material/Button';
import { Avatar, Grid, Paper, Stack, styled } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

type PostItem = {
    id: string;
    content: string;
    images: string[];
    author: { displayName: string | null; avatarUrl: string | null };
};

export default function Feed() {
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [posts, setPosts] = useState<Array<PostItem>>([]);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const result = await fetch('http://localhost:4000/api/user', {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
                const data = await result.json();
                console.log(data.user.avatarUrl);
                setProfilePic(data?.user?.avatarUrl ?? null);
            } catch (err) {
                console.log(err);
            }
        }
        fetchProfile();
        async function fetchPost() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const result = await fetch('http://localhost:4000/api/post', {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
                const data = await result.json();
                console.log(data.posts);
                setPosts(data.posts);
            } catch (err) {
                console.log(err);
            }
        }
        fetchPost();

    }, []);
    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: (theme.vars ?? theme).palette.text.secondary,
        ...theme.applyStyles('dark', {
            backgroundColor: '#1A2027',
        }),
    }));


    return (<div className='flex flex-col items-center w-12/12'>
        <Stack spacing={5} sx={{ width: "100%" }}>
            <NavBar profilePic={profilePic} />
            <div className="flex justify-center">
                <InputField />
            </div>
            <div className=" flex justify-center">
                <Button variant="contained">Post</Button>
            </div>
            <div className="w-12/12 px-7">
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                    {posts.map((post, index) => (
                        <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
                            <Item>
                                <div className='flex flex-col items-center gap-5'>
                                    <div className="flex justify-start w-12/12 gap-2">
                                        <Avatar src={post.author.avatarUrl ? post.author.avatarUrl : undefined} sx={{ width: 30, height: 30 }}/>
                                        <div className="flex items-center">
                                            {post.author.displayName}
                                        </div>
                                    </div>
                                    <div>{post.content}</div>
                                    
                                </div>

                            </Item>
                        </Grid>
                    ))}
                </Grid>
            </div>

        </Stack>
        {/* <div className="flex flex-col items-center">
            {posts.map((post, idx) => (
                <div key={idx}>{post}</div>
            ))}
        </div> */}



    </div>);


}