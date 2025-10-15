"use client"
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Link from 'next/link';
import { Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { Logout, Settings } from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import MenuIcon from '@mui/icons-material/Menu';
import { grey} from '@mui/material/colors';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase';
type Anchor = 'top';

export default function NavBar(Props:any) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }
  const handleLogOut = async () => {
    setAnchorEl(null);
    const { error } = await supabase.auth.signOut();
    if (error) console.log(error);
    router.push('/');
  };
  const handleProfile = () => {
    setAnchorEl(null);
    router.push('/Profile');
  };
  const handlers=[handleProfile,()=>{router.push("/Contacts")}];
    const [state, setState] = React.useState({
        top: false
    });
    const toggleDrawer =
        (anchor: Anchor, open: boolean) =>
            (event: React.KeyboardEvent | React.MouseEvent) => {
                if (
                    event.type === 'keydown' &&
                    ((event as React.KeyboardEvent).key === 'Tab' ||
                        (event as React.KeyboardEvent).key === 'Shift')
                ) {
                    return;
                }

                setState({ ...state, [anchor]: open });
            };
    const list = (anchor: Anchor) => (
        <Box
            sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <List>
                {['Profile', 'Contacts'].map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton onClick={handlers[index]}>
                            <ListItemIcon>
                                {index === 0 ? (
                                    <Avatar src={Props.profilePic ? `${Props.profilePic}}` : undefined} sx={{ width: 30, height: 30 }} />
                                ) : index === 1 ? (
                                    <EmailIcon color='primary'/>
                                ) : null}
                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                {['Log Out'].map((text) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton onClick={handleLogOut}>
                            <ListItemIcon>
                                <Logout fontSize="small" color='primary' />
                            </ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
  return (
    <div className="flex flex-row bg-blue-500 text-white py-3 px-2 items-center justify-between">
      <div>
        <h1>Social Media</h1>
      </div>
      <div className='hidden md:flex flex-row w-2/12 justify-around items-center'>
        <div className='hover:bg-blue-400 px-2 py-2 rounded-lg'>
          <Link href="#">Contacts</Link>
        </div>
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar src={Props.profilePic ? `${Props.profilePic}?ts=${Date.now()}` : undefined} sx={{ width: 32, height: 32 }}/>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfile}>
            <Avatar src={Props.profilePic ? `${Props.profilePic}?ts=${Date.now()}` : undefined} /> Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogOut}>
            <ListItemIcon>
              <Logout color='primary' fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

      </div>
      <div className="md:hidden flex flex-row w-2/12 justify-end items-center">
          {(['top'] as const).map((anchor) => (
                    <React.Fragment key={anchor}>
                        <IconButton size="small" sx={{ ml: 2 }} onClick={toggleDrawer(anchor, true)}>
                            <MenuIcon sx={{ color:grey[50] }} />
                        </IconButton>
                        <Drawer
                            anchor={anchor}
                            open={state[anchor]}
                            onClose={toggleDrawer(anchor, false)}
                        >
                            {list(anchor)}
                        </Drawer>
                    </React.Fragment>
                ))}
      </div>


    </div>
  )
}