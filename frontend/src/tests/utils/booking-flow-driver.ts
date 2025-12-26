import { screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

export interface BookingDetails {
    checkInDate: string;
    checkOutDate: string;
    guests: {
        adults: number;
        children: number;
        pets: number;
    };
    guestInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
}

export class BookingFlowDriver {
    constructor(private user: UserEvent) { }

    private async assertOnStep(stepName: string | RegExp) {
        try {
            // Look for the step indicator or header
            await waitFor(() => {
                const stepHeader = screen.queryByRole('heading', { name: stepName });
                // Also check for the active step indicator if applicable
                const activeStep = screen.queryByText(stepName, { selector: '.bg-blue-600' });

                if (!stepHeader && !activeStep) {
                    throw new Error(`Step "${stepName}" not found`);
                }
            }, { timeout: 2000 });
        } catch (error) {
            // Fail fast with debug info
            const body = document.body.textContent || '';
            // Use console.error to ensure visibility in test output
            console.error(`FAILURE DOM CONTENT: >>>${body.slice(0, 500)}<<<`);
            throw new Error(`Expected to be on step "${stepName}" but was not. \n${error instanceof Error ? error.message : ''}\nVisible Text: ${body.slice(0, 500)}...`);
        }
    }

    async fillGuestInfo(info: NonNullable<BookingDetails['guestInfo']>) {
        await waitFor(() => expect(screen.getByText(/guest information/i)).toBeInTheDocument(), { timeout: 2000 });

        await this.user.type(screen.getByLabelText(/first name/i), info.firstName);
        await this.user.type(screen.getByLabelText(/last name/i), info.lastName);
        await this.user.type(screen.getByLabelText(/email/i), info.email);
        await this.user.type(screen.getByLabelText(/phone/i), info.phone);

        await this.user.click(screen.getByRole('button', { name: /continue/i }));
    }

    async fillDates(checkIn: string, checkOut: string) {
        await this.assertOnStep(/select dates/i);

        const checkInInput = screen.getByLabelText(/check-in date/i);
        await this.user.clear(checkInInput);
        await this.user.type(checkInInput, checkIn);

        const checkOutInput = screen.getByLabelText(/check-out date/i);
        await this.user.clear(checkOutInput);
        await this.user.type(checkOutInput, checkOut);
    }

    async setGuests(adults: number, children: number, pets: number) {
        // We assume we are on the same step as dates (Step 1)
        const adultsInput = screen.getByLabelText(/adults/i);
        await this.user.clear(adultsInput);
        await this.user.type(adultsInput, adults.toString());

        if (children > 0) {
            const childrenInput = screen.getByLabelText(/children/i);
            await this.user.clear(childrenInput);
            await this.user.type(childrenInput, children.toString());
        }

        // Check if pets input exists (it might be disabled/hidden if site doesn't allow pets)
        const petsInput = screen.queryByLabelText(/pets/i);
        if (pets > 0 && petsInput) {
            if (petsInput.hasAttribute('disabled')) {
                throw new Error('Pets allowed in test data but site does not allow pets');
            }
            await this.user.clear(petsInput);
            await this.user.type(petsInput, pets.toString());
        }

        await this.clickNext();
    }

    async fillGuestDetails(_adults: number) {
        await this.assertOnStep(/guest information/i);

        // Fill all First Name inputs if enabled
        const firstNames = await screen.findAllByLabelText(/first name/i);
        for (const input of firstNames) {
            if (!input.hasAttribute('disabled')) {
                await this.user.clear(input);
                await this.user.type(input, 'Test Guest');
            }
        }

        // Fill all Last Name inputs if enabled
        const lastNames = await screen.findAllByLabelText(/last name/i);
        for (const input of lastNames) {
            if (!input.hasAttribute('disabled')) {
                await this.user.clear(input);
                await this.user.type(input, 'Test Guest');
            }
        }

        await this.clickNext();
    }

    async skipVehicles() {
        await this.assertOnStep(/vehicle information/i);
        await this.clickNext();
    }

    async skipEquipment() {
        await this.assertOnStep(/equipment rentals/i);
        await this.clickNext();
    }

    async reviewAndConfirm() {
        await this.assertOnStep(/review & confirm/i);
        await this.user.click(screen.getByRole('button', { name: /confirm booking/i }));
    }

    async clickNext() {
        await this.user.click(screen.getByRole('button', { name: /next/i }));
    }

    async expectFormError(messageOrRegex: string | RegExp) {
        const alert = await screen.findByRole('alert'); // Should use role="alert" for errors
        expect(within(alert).getByText(messageOrRegex)).toBeInTheDocument();
    }

    async verifyConfimation(bookingId: string) {
        // Wait for navigation
        await waitFor(() => {
            expect(window.location.pathname).toContain(bookingId);
        });
    }

    async completePayment() {
        // Wait for payment modal
        await waitFor(() => {
            expect(screen.getByText('Complete Payment')).toBeInTheDocument();
        });

        // Click Pay button (assuming mock payment form or similar button text)
        await this.user.click(screen.getByRole('button', { name: /pay/i }));
    }

    // Rigid composite method for Guest Happy Path
    async completeGuestBooking(details: BookingDetails) {
        if (!details.guestInfo) throw new Error('Guest Info required for guest flow');

        await this.fillGuestInfo(details.guestInfo);

        await this.fillDates(details.checkInDate, details.checkOutDate);
        await this.setGuests(details.guests.adults, details.guests.children, details.guests.pets);

        // Step 2: Guest Details
        await this.fillGuestDetails(details.guests.adults);

        // Step 3: Vehicles
        await this.skipVehicles();

        // Step 4: Equipment
        await this.skipEquipment();

        // Step 5: Review
        await this.reviewAndConfirm();

        // Payment
        await this.completePayment();
    }

    // Rigid composite method for Customer Happy Path
    async completeCustomerBooking(details: BookingDetails) {
        // Customer flow starts directly at BookingForm (Step 1)

        await this.fillDates(details.checkInDate, details.checkOutDate);
        await this.setGuests(details.guests.adults, details.guests.children, details.guests.pets);

        // Step 2: Guest Details
        await this.fillGuestDetails(details.guests.adults);

        // Step 3: Vehicles
        await this.skipVehicles();

        // Step 4: Equipment
        await this.skipEquipment();

        // Step 5: Review
        await this.reviewAndConfirm();

        // Note: Customer bookings submit directly and redirect to booking details
        // Payment is handled separately (not part of the form flow)
    }
}
