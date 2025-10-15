import TextField from '@mui/material/TextField';
export default function InputField(){
    return (<TextField
          id="outlined-multiline-static"
          label="Write what you think."
          sx={{ width: '50%' }}
          multiline
          rows={4}
          defaultValue=""
        />);
}