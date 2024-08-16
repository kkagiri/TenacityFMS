import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
  
} from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { signIn } from '../../redux/actions/AuthActions'; // Import the signIn action

import './LoginForm.scss';

const LoginForm = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  const formData = useRef({ username: '', password: '' });

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { username, password } = formData.current;

    try {
      const result = await dispatch(signIn(username, password));
      if (!result.isOk) {
        notify(result.message, 'error', 2000);
      }
    } catch (error) {
      notify(error.message, 'error', 2000);
    }
  }, [dispatch]);

  return (
    <form className={'login-form'} onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
        <Item
          dataField={'username'}
          editorType={'dxTextBox'}
          editorOptions={UserNameEditorOptions}
        >
          <RequiredRule message="Username is required" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'password'}
          editorType={'dxTextBox'}
          editorOptions={passwordEditorOptions}
        >
          <RequiredRule message="Password is required" />
          <Label visible={false} />
        </Item>
        <ButtonItem>
          <ButtonOptions
            width={'100%'}
            type={'default'}
            useSubmitBehavior={true}
          >
            <span className="dx-button-text">
              {
                loading
                  ? <LoadIndicator width={'24px'} height={'24px'} visible={true} />
                  : 'Sign In'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>
    </form>
  );
}

const UserNameEditorOptions = { stylingMode: 'filled', placeholder: 'Username', mode: 'username' };
const passwordEditorOptions = { stylingMode: 'filled', placeholder: 'Password', mode: 'password' };

export default LoginForm;